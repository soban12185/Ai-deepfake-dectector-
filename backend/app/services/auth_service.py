"""
Auth Service — user registration, login, and token issuance.
"""

import logging
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse

logger = logging.getLogger(__name__)


def register_user(payload: UserCreate, db: Session) -> TokenResponse:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")

    user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    logger.info(f"New user registered: {user.email}")
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


def login_user(payload: UserLogin, db: Session) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is disabled")

    token = create_access_token({"sub": str(user.id)})
    logger.info(f"User logged in: {user.email}")
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )
