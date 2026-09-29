import datetime
import re
import secrets
from typing import List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.meeting import Meeting
from app.models.participant import ParticipantSession
from app.schemas.meeting import InstantMeetingCreate, ScheduledMeetingCreate


class MeetingService:
    @staticmethod
    def normalize_code(raw_code: str) -> str:
        """Strip non-digits to produce normalized 10-digit code."""
        return re.sub(r"\D", "", raw_code)

    @classmethod
    def generate_meeting_code(cls, db: Session) -> str:
        """Generate a random 10-digit numeric code with uniqueness guarantee."""
        for _ in range(10):
            first_digit = secrets.choice("123456789")
            remaining_digits = "".join(secrets.choice("0123456789") for _ in range(9))
            candidate = f"{first_digit}{remaining_digits}"
            exists = db.query(Meeting.id).filter(Meeting.meeting_code == candidate).first()
            if not exists:
                return candidate
        raise RuntimeError("Failed to generate unique meeting code after 10 attempts")

    @classmethod
    def create_instant_meeting(cls, db: Session, payload: InstantMeetingCreate) -> Meeting:
        code = cls.generate_meeting_code(db)
        host_token = secrets.token_hex(16)
        now = datetime.datetime.now(datetime.timezone.utc)
        host_name = payload.host_name or "Rohan"
        title = payload.title or f"{host_name}'s Meeting"

        meeting = Meeting(
            meeting_code=code,
            title=title,
            description="Instant video meeting",
            host_name=host_name,
            meeting_type="instant",
            status="live",
            host_control_token=host_token,
            created_at=now,
            started_at=now,
            duration_minutes=45
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)
        return meeting

    @classmethod
    def create_scheduled_meeting(cls, db: Session, payload: ScheduledMeetingCreate) -> Meeting:
        code = cls.generate_meeting_code(db)
        host_token = secrets.token_hex(16)
        now = datetime.datetime.now(datetime.timezone.utc)
        host_name = payload.host_name or "Rohan"

        meeting = Meeting(
            meeting_code=code,
            title=payload.title,
            description=payload.description,
            host_name=host_name,
            meeting_type="scheduled",
            scheduled_at=payload.scheduled_at,
            duration_minutes=payload.duration_minutes or 45,
            status="scheduled",
            host_control_token=host_token,
            created_at=now
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)
        return meeting

    @classmethod
    def get_meeting_by_code(cls, db: Session, meeting_code: str) -> Optional[Meeting]:
        normalized = cls.normalize_code(meeting_code)
        if not normalized or len(normalized) != 10:
            return None
        return db.query(Meeting).filter(Meeting.meeting_code == normalized).first()

    @classmethod
    def list_upcoming_meetings(cls, db: Session, limit: int = 10) -> List[Meeting]:
        now = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=30)
        return (
            db.query(Meeting)
            .filter(
                Meeting.status == "scheduled",
                (Meeting.scheduled_at >= now) | (Meeting.scheduled_at.is_(None))
            )
            .order_by(Meeting.scheduled_at.asc().nullslast())
            .limit(limit)
            .all()
        )

    @classmethod
    def list_recent_meetings(cls, db: Session, limit: int = 10) -> List[Meeting]:
        return (
            db.query(Meeting)
            .filter(Meeting.status.in_(["ended", "live"]))
            .order_by(func.coalesce(Meeting.ended_at, Meeting.started_at, Meeting.created_at).desc())
            .limit(limit)
            .all()
        )

    @classmethod
    def record_participant_join(
        cls, db: Session, meeting: Meeting, identity: str, display_name: str, role: str
    ) -> ParticipantSession:
        session = ParticipantSession(
            meeting_id=meeting.id,
            participant_uid=secrets.token_hex(12),
            identity=identity,
            display_name=display_name,
            role=role,
            joined_at=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(session)
        # If meeting was scheduled, transition to live
        if meeting.status == "scheduled":
            meeting.status = "live"
            meeting.started_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(session)
        return session

    @classmethod
    def record_participant_leave(cls, db: Session, identity: str) -> Optional[ParticipantSession]:
        session = (
            db.query(ParticipantSession)
            .filter(ParticipantSession.identity == identity, ParticipantSession.left_at.is_(None))
            .order_by(ParticipantSession.joined_at.desc())
            .first()
        )
        if session:
            session.left_at = datetime.datetime.now(datetime.timezone.utc)
            db.commit()
        return session

    @classmethod
    def end_meeting(cls, db: Session, meeting: Meeting) -> Meeting:
        meeting.status = "ended"
        meeting.ended_at = datetime.datetime.now(datetime.timezone.utc)
        # Mark open sessions left
        open_sessions = (
            db.query(ParticipantSession)
            .filter(ParticipantSession.meeting_id == meeting.id, ParticipantSession.left_at.is_(None))
            .all()
        )
        for s in open_sessions:
            s.left_at = meeting.ended_at
        db.commit()
        db.refresh(meeting)
        return meeting
