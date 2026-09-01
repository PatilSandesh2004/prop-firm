import uuid

from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.user import User


def _extract_bearer(authorization: str | None) -> str:
    """Handle the extract bearer workflow for the trading simulation and connect the related backend logic."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    return authorization.split(" ", 1)[1].strip()


async def get_current_user(
    db: AsyncSession = Depends(get_db), authorization: str | None = Header(default=None)
) -> User:
    """Fetch the current user for the current request."""
    token = _extract_bearer(authorization)
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token subject")
        user = await db.get(User, uuid.UUID(user_id))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Unauthorized") from exc

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Inactive or missing user")
    return user
