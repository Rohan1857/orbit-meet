import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.meeting import Meeting
from app.models.user import User
from app.core.auth import get_current_user, require_authenticated_user
from app.schemas.meeting import (
    InstantMeetingCreate,
    ScheduledMeetingCreate,
    MeetingResponse,
    MeetingDetailResponse,
)
from app.schemas.participant import (
    JoinMeetingRequest,
    JoinMeetingResponse,
    LeaveMeetingRequest,
)
from app.services.meeting_service import MeetingService
from app.services.livekit_service import LiveKitService

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def format_meeting_response(meeting: Meeting, include_token: bool = False) -> dict:
    data = {
        "id": meeting.id,
        "meeting_code": meeting.meeting_code,
        "title": meeting.title,
        "description": meeting.description,
        "host_name": meeting.host_name,
        "meeting_type": meeting.meeting_type,
        "scheduled_at": meeting.scheduled_at,
        "duration_minutes": meeting.duration_minutes,
        "status": meeting.status,
        "owner_user_id": meeting.owner_user_id,
        "invite_url": f"{settings.frontend_origin}/join?meeting={meeting.meeting_code}",
        "created_at": meeting.created_at,
        "started_at": meeting.started_at,
        "ended_at": meeting.ended_at,
    }
    if include_token:
        data["host_control_token"] = meeting.host_control_token
    return data


@router.post("/instant", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_instant_meeting(
    payload: InstantMeetingCreate = InstantMeetingCreate(),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db)
):
    owner_user_id = current_user.id
    payload.host_name = current_user.display_name

    meeting = MeetingService.create_instant_meeting(db, payload, owner_user_id=owner_user_id)
    return format_meeting_response(meeting, include_token=True)


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_scheduled_meeting(
    payload: ScheduledMeetingCreate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db)
):
    owner_user_id = current_user.id
    payload.host_name = current_user.display_name

    meeting = MeetingService.create_scheduled_meeting(db, payload, owner_user_id=owner_user_id)
    return format_meeting_response(meeting, include_token=True)


@router.get("", response_model=List[MeetingResponse])
def list_meetings(
    filter: Optional[str] = Query(default=None, pattern="^(upcoming|recent)$"),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db)
):
    owner_id = current_user.id
    if filter == "upcoming":
        meetings = MeetingService.list_upcoming_meetings(db, owner_user_id=owner_id, limit=limit)
    elif filter == "recent":
        meetings = MeetingService.list_recent_meetings(db, owner_user_id=owner_id, limit=limit)
    else:
        meetings = (
            db.query(Meeting)
            .filter(Meeting.owner_user_id == owner_id)
            .order_by(Meeting.created_at.desc())
            .limit(limit)
            .all()
        )
    return [format_meeting_response(m) for m in meetings]


@router.get("/{meeting_code}", response_model=MeetingDetailResponse)
def get_meeting(
    meeting_code: str,
    db: Session = Depends(get_db)
):
    meeting = MeetingService.get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    res = format_meeting_response(meeting)
    res["active_participants_count"] = len([p for p in meeting.participants if not p.left_at])
    return res


@router.post("/{meeting_code}/join", response_model=JoinMeetingResponse)
def join_meeting(
    meeting_code: str,
    payload: JoinMeetingRequest,
    x_host_token: Optional[str] = Header(default=None),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meeting = MeetingService.get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.status == "ended":
        raise HTTPException(status_code=400, detail="This meeting has already ended")

    is_host = False
    if meeting.owner_user_id is not None:
        if current_user and meeting.owner_user_id == current_user.id:
            is_host = True
        else:
            payload.role = "participant"
    elif payload.role == "host":
        if x_host_token and x_host_token == meeting.host_control_token:
            is_host = True
        else:
            payload.role = "participant"

    # Generate identity
    role_prefix = "host" if is_host else "user"
    clean_name = "".join(c for c in payload.display_name.lower() if c.isalnum()) or "guest"
    identity = f"{role_prefix}_{clean_name}_{secrets.token_hex(4)}"

    # Record participant session in SQLite
    MeetingService.record_participant_join(
        db,
        meeting=meeting,
        identity=identity,
        display_name=payload.display_name,
        role="host" if is_host else "participant"
    )

    # Issue LiveKit access token
    token = LiveKitService.generate_token(
        room_name=meeting.meeting_code,
        participant_identity=identity,
        display_name=payload.display_name,
        is_host=is_host
    )
    _, _, url = LiveKitService.get_api_credentials()

    return JoinMeetingResponse(
        meeting_code=meeting.meeting_code,
        title=meeting.title,
        participant_identity=identity,
        display_name=payload.display_name,
        role="host" if is_host else "participant",
        token=token,
        livekit_url=url
    )


@router.post("/{meeting_code}/leave")
def leave_meeting(
    meeting_code: str,
    payload: LeaveMeetingRequest,
    db: Session = Depends(get_db)
):
    session = MeetingService.record_participant_leave(db, payload.participant_identity)
    return {"status": "recorded", "identity": payload.participant_identity}
