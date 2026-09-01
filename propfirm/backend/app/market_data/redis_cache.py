import logging
from typing import Optional

from app.db.redis import redis_client
from app.schemas.market_data import Quote

logger = logging.getLogger(__name__)


class MarketDataCache:
    PREFIX = "market:quote:"
    _memory_quotes: dict[str, Quote] = {}
    _redis_available: bool | None = None

    @classmethod
    def _key(cls, symbol: str) -> str:
        """Handle the key workflow for the trading simulation and connect the related backend logic."""
        return f"{cls.PREFIX}{symbol}"

    @classmethod
    async def set_quote(cls, quote: Quote) -> None:
        """Handle the set quote workflow for the trading simulation and connect the related backend logic."""
        cls._memory_quotes[quote.symbol] = quote
        if cls._redis_available is False:
            return
        try:
            # Store as JSON string. Decimal requires string conversion.
            # Using model_dump_json takes care of Decimals/Datetimes automatically in Pydantic V2
            await redis_client.set(cls._key(quote.symbol), quote.model_dump_json())
            cls._redis_available = True
        except Exception as e:
            if cls._redis_available is not False:
                logger.warning("Redis unavailable; using in-memory market quote fallback")
            cls._redis_available = False

    @classmethod
    async def get_quote(cls, symbol: str) -> Optional[Quote]:
        """Fetch the quote for the current request."""
        if cls._redis_available is False:
            return cls._memory_quotes.get(symbol)
        try:
            data = await redis_client.get(cls._key(symbol))
            if data:
                cls._redis_available = True
                return Quote.model_validate_json(data)
            return cls._memory_quotes.get(symbol)
        except Exception as e:
            if cls._redis_available is not False:
                logger.warning("Redis unavailable; reading from in-memory market quote fallback")
            cls._redis_available = False
            return cls._memory_quotes.get(symbol)
