import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class InstantMeetingCreate(BaseModel):
    host_name: Optional[str] = Field(default="Rohan", max_length=100)
    title: Optional[str] = Field(default=None, max_length=255)


class ScheduledMeetingCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    scheduled_at: datetime.datetime
    duration_minutes: Optional[int] = Field(default=45, ge=15, le=480)
    host_name: Optional[str] = Field(default="Rohan", max_length=100)

    @field_validator("scheduled_at")
    @classmethod
    def validate_future_date(cls, v: datetime.datetime) -> datetime.datetime:
        now = datetime.datetime.now(datetime.timezone.utc)
        target = v if v.tzinfo else v.replace(tzinfo=datetime.timezone.utc)
        if target <= now - datetime.timedelta(minutes=5):
            raise ValueError("Scheduled time must be in the future")
        return target


class MeetingResponse(BaseModel):
    id: int
    meeting_code: str
    title: str
    description: Optional[str] = None
    host_name: str
    meeting_type: str
    scheduled_at: Optional[datetime.datetime] = None
    duration_minutes: Optional[int] = 45
    status: str
    host_control_token: Optional[str] = None
    invite_url: Optional[str] = None
    created_at: datetime.datetime
    started_at: Optional[datetime.datetime] = None
    ended_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


class MeetingDetailResponse(MeetingResponse):
    active_participants_count: int = 0
