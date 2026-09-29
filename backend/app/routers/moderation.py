from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.meeting import Meeting
from app.services.meeting_service import MeetingService
from app.services.livekit_service import LiveKitService

router = APIRouter(prefix="/api/meetings/{meeting_code}", tags=["moderation"])


def verify_host(
    meeting_code: str,
    x_host_token: str = Header(..., description="Secret host authorization token"),
    db: Session = Depends(get_db)
) -> Meeting:
    meeting = MeetingService.get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
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
    # Audio track typically prefixed with TR_
    return {"status": "muted", "identity": identity}


@router.post("/mute-all")
async def mute_all_participants(
    meeting: Meeting = Depends(verify_host)
):
    return {"status": "muted_all", "meeting_code": meeting.meeting_code}
