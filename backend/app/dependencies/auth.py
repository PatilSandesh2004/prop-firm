from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.database import get_db
from app.models.user import User


async def get_current_user(db: AsyncSession = Depends(get_db)) -> User:
    """Resolve the acting user for this deployment.

    Login has been removed -- every request acts as the single demo
    trading user (settings.DEMO_TRADER_EMAIL) instead of requiring a
    bearer token. Ownership/role checks elsewhere (account ownership in
    accounts.py/orders.py, ADMIN-gated routes in admin.py) are unchanged
    and still apply to this resolved identity.
    """
    stmt = select(User).where(User.email == settings.DEMO_TRADER_EMAIL)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=500, detail="Demo user not seeded")
    return user
