import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class ParticipantSession(Base):
    __tablename__ = "participant_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    participant_uid = Column(String(64), nullable=False)
    identity = Column(String(64), nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default="participant")
    joined_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    left_at = Column(DateTime(timezone=True), nullable=True)

    meeting = relationship("Meeting", back_populates="participants")


Index("idx_participant_meeting_joined", ParticipantSession.meeting_id, ParticipantSession.joined_at)
