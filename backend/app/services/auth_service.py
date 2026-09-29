import datetime
from typing import Tuple, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.config import settings
from app.models.user import User
from app.schemas.auth import UserRegisterRequest, UserLoginRequest
from app.core.security import hash_password, verify_password, create_access_token


class AuthService:
    @staticmethod
    def register_user(db: Session, payload: UserRegisterRequest) -> Tuple[User, str]:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists"
            )

        pwd_hash = hash_password(payload.password)
        now = datetime.datetime.now(datetime.timezone.utc)
        user = User(
            email=payload.email,
            display_name=payload.display_name,
            password_hash=pwd_hash,
            last_login_at=now
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(user.id, user.email)
        return user, token

    @staticmethod
    def login_user(db: Session, payload: UserLoginRequest) -> Tuple[User, str]:
        user = db.query(User).filter(User.email == payload.email).first()
        if not user or not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        user.last_login_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(user)

        token = create_access_token(user.id, user.email)
        return user, token

    @staticmethod
    def login_with_google(db: Session, credential: str) -> Tuple[User, str]:
        try:
            # Verify Google ID token signature, issuer, audience, and exp
            audience = settings.google_client_id if settings.google_client_id else None
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                audience=audience
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google ID token: {str(e)}"
            )

        sub = idinfo.get("sub")
        email = (idinfo.get("email") or "").lower()
        name = idinfo.get("name") or "Google User"
        picture = idinfo.get("picture")

        if not sub or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token missing required identity claims"
            )

        now = datetime.datetime.now(datetime.timezone.utc)

        # 1. Check if user with this google_sub already exists
        user_by_sub = db.query(User).filter(User.google_sub == sub).first()
        if user_by_sub:
            user_by_sub.last_login_at = now
            if picture:
                user_by_sub.avatar_url = picture
            db.commit()
            db.refresh(user_by_sub)
            token = create_access_token(user_by_sub.id, user_by_sub.email)
            return user_by_sub, token

        # 2. Check if user with this email already exists
        user_by_email = db.query(User).filter(User.email == email).first()
        if user_by_email:
            # If registered with password and not linked to this Google sub, return conflict
            if user_by_email.password_hash and not user_by_email.google_sub:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="ACCOUNT_EXISTS_WITH_DIFFERENT_METHOD"
                )
            user_by_email.google_sub = sub
            user_by_email.last_login_at = now
            if picture:
                user_by_email.avatar_url = picture
            db.commit()
            db.refresh(user_by_email)
            token = create_access_token(user_by_email.id, user_by_email.email)
            return user_by_email, token

        # 3. Provision new Google user
        new_user = User(
            email=email,
            display_name=name,
            google_sub=sub,
            avatar_url=picture,
            password_hash=None,
            last_login_at=now
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        token = create_access_token(new_user.id, new_user.email)
        return new_user, token

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()
