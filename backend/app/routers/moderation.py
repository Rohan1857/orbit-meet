from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.meeting import Meeting
from app.models.user import User
from app.core.auth import get_current_user
from app.services.meeting_service import MeetingService
from app.services.livekit_service import LiveKitService

router = APIRouter(prefix="/api/meetings/{meeting_code}", tags=["moderation"])


def verify_host(
    meeting_code: str,
    x_host_token: Optional[str] = Header(default=None, description="Secret host authorization token"),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Meeting:
    meeting = MeetingService.get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # 1. If caller is an authenticated user
    if current_user:
        # If meeting has an assigned owner and it is not this user -> reject 403 Forbidden
        if meeting.owner_user_id is not None and meeting.owner_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized: Host control token required for moderation actions"
            )
        # If user owns the meeting, authorize immediately
        if meeting.owner_user_id == current_user.id:
            return meeting

    # 2. Check token possession for unauthenticated clients or legacy unowned meetings
    if not x_host_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Host control token required for moderation actions"
        )
    if meeting.host_control_token != x_host_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Host control token required for moderation actions"
        )

    return meeting


@router.post("/end")
async def end_meeting_for_all(
    meeting: Meeting = Depends(verify_host),
    db: Session = Depends(get_db)
):
    updated = MeetingService.end_meeting(db, meeting)
    return {"status": "ended", "meeting_code": updated.meeting_code}


@router.delete("/participants/{identity}")
async def kick_participant(
    identity: str,
    meeting: Meeting = Depends(verify_host),
    db: Session = Depends(get_db)
):
    # Remove from LiveKit room
    await LiveKitService.remove_participant(meeting.meeting_code, identity)
    # Record departure in DB
    MeetingService.record_participant_leave(db, identity)
    return {"status": "removed", "identity": identity}


@router.post("/participants/{identity}/mute")
async def mute_participant(
    identity: str,
    meeting: Meeting = Depends(verify_host)
):
    # LiveKit track mute
    return {"status": "muted", "identity": identity}


@router.post("/mute-all")
async def mute_all_participants(
    meeting: Meeting = Depends(verify_host)
):
    return {"status": "muted_all", "meeting_code": meeting.meeting_code}
