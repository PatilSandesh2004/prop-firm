import uuid

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.user import User


async def get_current_user(
    db: AsyncSession = Depends(get_db), authorization: str | None = Header(default=None)
) -> User:
    """Resolve the acting user for this request.

    - No `Authorization` header at all: resolve to the single demo trading
      user (settings.DEMO_TRADER_EMAIL), same as this deployment's previous
      no-login behavior. Keeps direct terminal/API access working with zero
      setup.
    - A bearer token that decodes to a real, active user: use that user, so
      accounts created via /auth/register are actually isolated per-user.
    - A bearer token that's missing/invalid/expired: reject with 401 rather
      than silently falling back to the demo user, so a signed-in user is
      never quietly swapped to someone else's identity.
    """
    if not authorization:
        stmt = select(User).where(User.email == settings.DEMO_TRADER_EMAIL)
        user = (await db.execute(stmt)).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=500, detail="Demo user not seeded")
        return user

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token subject")
        user = await db.get(User, uuid.UUID(user_id))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Inactive or missing user")
    return user
