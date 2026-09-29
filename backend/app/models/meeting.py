import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_code = Column(String(10), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    host_name = Column(String(100), nullable=False, default="Rohan")
    meeting_type = Column(String(20), nullable=False, default="instant")
    scheduled_at = Column(DateTime(timezone=True), nullable=True, index=True)
    duration_minutes = Column(Integer, nullable=True, default=45)
    status = Column(String(20), nullable=False, default="live", index=True)
    host_control_token = Column(String(64), nullable=False)
    owner_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="meetings", foreign_keys=[owner_user_id])
    participants = relationship(
        "ParticipantSession",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="ParticipantSession.joined_at"
    )
