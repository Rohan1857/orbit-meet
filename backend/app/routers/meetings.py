import datetime
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
    MeetingPermissionsUpdate,
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
        "is_locked": bool(getattr(meeting, "is_locked", False)),
        "allow_participant_unmute": bool(getattr(meeting, "allow_participant_unmute", True)),
        "allow_participant_screen_share": bool(getattr(meeting, "allow_participant_screen_share", True)),
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
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meeting = MeetingService.get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    # Enforce duration limit if meeting is live and expired
    now = datetime.datetime.now(datetime.timezone.utc)
    if meeting.status == "live" and meeting.started_at and meeting.duration_minutes:
        started = meeting.started_at if meeting.started_at.tzinfo else meeting.started_at.replace(tzinfo=datetime.timezone.utc)
        if now > started + datetime.timedelta(minutes=meeting.duration_minutes):
            MeetingService.end_meeting(db, meeting)
            meeting.status = "ended"

    is_owner = bool(current_user and meeting.owner_user_id == current_user.id)
    res = format_meeting_response(meeting, include_token=is_owner)
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

    now = datetime.datetime.now(datetime.timezone.utc)
    if meeting.status == "live" and meeting.started_at and meeting.duration_minutes:
        started = meeting.started_at if meeting.started_at.tzinfo else meeting.started_at.replace(tzinfo=datetime.timezone.utc)
        if now > started + datetime.timedelta(minutes=meeting.duration_minutes):
            MeetingService.end_meeting(db, meeting)
            raise HTTPException(
                status_code=400,
                detail="This meeting has ended because its scheduled duration has expired"
            )

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

    if getattr(meeting, "is_locked", False) and not is_host:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="This meeting has been locked by the host."
        )

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


def _verify_meeting_host(meeting: Meeting, current_user: Optional[User], x_host_token: Optional[str]):
    if meeting.owner_user_id is not None:
        if not current_user or meeting.owner_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized: Only the meeting owner can perform host moderation actions"
            )
        return
    if not (x_host_token and meeting.host_control_token == x_host_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Host control token required for moderation actions"
        )


@router.post("/{meeting_code}/lock")
def lock_meeting(
    meeting_code: str,
    x_host_token: Optional[str] = Header(default=None),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meeting = MeetingService.get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    _verify_meeting_host(meeting, current_user, x_host_token)
    meeting.is_locked = True
    db.commit()
    db.refresh(meeting)
    return {"status": "locked", "meeting_code": meeting_code, "is_locked": True}


@router.post("/{meeting_code}/unlock")
def unlock_meeting(
    meeting_code: str,
    x_host_token: Optional[str] = Header(default=None),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meeting = MeetingService.get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    _verify_meeting_host(meeting, current_user, x_host_token)
    meeting.is_locked = False
    db.commit()
    db.refresh(meeting)
    return {"status": "unlocked", "meeting_code": meeting_code, "is_locked": False}


@router.patch("/{meeting_code}/permissions")
def update_meeting_permissions(
    meeting_code: str,
    payload: MeetingPermissionsUpdate,
    x_host_token: Optional[str] = Header(default=None),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meeting = MeetingService.get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    _verify_meeting_host(meeting, current_user, x_host_token)
    if payload.allow_participant_unmute is not None:
        meeting.allow_participant_unmute = payload.allow_participant_unmute
    if payload.allow_participant_screen_share is not None:
        meeting.allow_participant_screen_share = payload.allow_participant_screen_share
    db.commit()
    db.refresh(meeting)
    return {
        "status": "updated",
        "meeting_code": meeting_code,
        "allow_participant_unmute": meeting.allow_participant_unmute,
        "allow_participant_screen_share": meeting.allow_participant_screen_share
    }
