import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
ALGORITHM = "HS256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify the password request before processing the next step."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Fetch the password hash for the current request."""
    return pwd_context.hash(password)


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    """Create a new access token entry and persist it to the database."""
    now = datetime.now(timezone.utc)
    expiry = now + timedelta(
        minutes=expires_minutes or settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    # jti makes each token unique even when issued in the same second (e.g.
    # register immediately followed by refresh) so two tokens for the same
    # user are never accidentally byte-identical strings.
    payload: Dict[str, Any] = {
        "sub": subject,
        "type": "access",
        "iat": now,
        "exp": expiry,
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(subject: str) -> str:
    """Create a long-lived refresh token used only to mint new access tokens."""
    now = datetime.now(timezone.utc)
    expiry = now + timedelta(minutes=settings.JWT_REFRESH_TOKEN_EXPIRE_MINUTES)
    payload: Dict[str, Any] = {
        "sub": subject,
        "type": "refresh",
        "iat": now,
        "exp": expiry,
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Handle the decode access token workflow for the trading simulation and connect the related backend logic."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc
    if payload.get("type") != "access":
        raise ValueError("Invalid or expired token")
    return payload


def decode_refresh_token(token: str) -> Dict[str, Any]:
    """Decode and validate a refresh token, rejecting anything that isn't one."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid or expired refresh token") from exc
    if payload.get("type") != "refresh":
        raise ValueError("Invalid or expired refresh token")
    return payload
