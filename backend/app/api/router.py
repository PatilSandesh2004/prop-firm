import logging

import redis.asyncio as redis
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.accounts import router as accounts_router
from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.challenges import router as challenges_router
from app.api.instruments import router as instruments_router
from app.api.market import router as market_router
from app.api.market_data import router as market_data_router
from app.api.orders import router as orders_router
from app.api.trades import router as trades_router
from app.db.database import get_db
from app.db.redis import get_redis

logger = logging.getLogger(__name__)

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(challenges_router)
api_router.include_router(accounts_router)
api_router.include_router(instruments_router)
api_router.include_router(market_router)
api_router.include_router(market_data_router)
api_router.include_router(orders_router)
api_router.include_router(trades_router)


@api_router.get("/health")
async def health_check(
    db: AsyncSession = Depends(get_db), redis_client: redis.Redis = Depends(get_redis)
):
    """Return the API health status so the service can confirm it is running."""
    status = {"status": "ok", "database": "ok", "redis": "ok"}

    # Check DB
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        status["database"] = "error"
        status["status"] = "error"

    # Check Redis
    try:
        await redis_client.ping()
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        status["redis"] = "error"
        status["status"] = "error"

    return status
