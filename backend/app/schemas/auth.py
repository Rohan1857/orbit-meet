import datetime
import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


class UserRegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (at least 8 chars)")
    display_name: str = Field(..., min_length=2, max_length=100, description="User full display name")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        # Basic RFC 5322 regex validation
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(pattern, clean):
            raise ValueError("Invalid email format")
        return clean

    @field_validator("display_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 2:
            raise ValueError("Display name must be at least 2 characters")
        return clean


class UserLoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="Password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., min_length=10, description="Google Identity Services signed ID token")


class UserResponse(BaseModel):
    id: int
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    user: UserResponse
    token: str
