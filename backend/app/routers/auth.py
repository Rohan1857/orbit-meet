from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    GoogleAuthRequest,
    UserResponse,
    AuthResponse,
)
from app.services.auth_service import AuthService
from app.core.auth import require_authenticated_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    user, token = AuthService.register_user(db, payload)
    return AuthResponse(user=UserResponse.model_validate(user), token=token)


@router.post("/login", response_model=AuthResponse)
def login(
    payload: UserLoginRequest,
    db: Session = Depends(get_db)
):
    user, token = AuthService.login_user(db, payload)
    return AuthResponse(user=UserResponse.model_validate(user), token=token)


@router.post("/google", response_model=AuthResponse)
def google_sign_in(
    payload: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    user, token = AuthService.login_with_google(db, payload.credential)
    return AuthResponse(user=UserResponse.model_validate(user), token=token)


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(require_authenticated_user)
):
    return UserResponse.model_validate(current_user)


@router.post("/logout")
def logout():
    return {"status": "ok", "message": "Successfully logged out"}
