from typing import AsyncGenerator

import redis.asyncio as redis

from app.core.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


async def get_redis() -> AsyncGenerator[redis.Redis, None]:
    """Fetch the redis for the current request."""
    yield redis_client
