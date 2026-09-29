import datetime
from typing import Optional
from pydantic import BaseModel, Field


class JoinMeetingRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100)
    role: Optional[str] = Field(default="participant", pattern="^(host|participant)$")


class JoinMeetingResponse(BaseModel):
    meeting_code: str
    title: str
    participant_identity: str
    display_name: str
    role: str
    token: str
    livekit_url: str


class LeaveMeetingRequest(BaseModel):
    participant_identity: str = Field(..., min_length=1)


class ParticipantResponse(BaseModel):
    id: int
    participant_uid: str
    identity: str
    display_name: str
    role: str
    joined_at: datetime.datetime
    left_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}
