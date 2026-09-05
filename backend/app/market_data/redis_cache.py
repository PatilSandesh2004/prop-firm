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
    async def set_quotes_many(cls, quotes: list[Quote]) -> None:
        """Batch set multiple quotes in cache at once."""
        if not quotes:
            return
        for quote in quotes:
            cls._memory_quotes[quote.symbol] = quote
        if cls._redis_available is False:
            return
        try:
            mapping = {cls._key(q.symbol): q.model_dump_json() for q in quotes}
            await redis_client.mset(mapping)
            cls._redis_available = True
        except Exception as e:
            if cls._redis_available is not False:
                logger.warning("Redis unavailable; using in-memory market quote fallback")
            cls._redis_available = False

    @classmethod
    async def get_quotes_many(cls, symbols: list[str]) -> dict[str, Quote]:
        """Batch fetch multiple quotes for requested symbols."""
        if not symbols:
            return {}
        result: dict[str, Quote] = {}
        missing_symbols: list[str] = list(symbols)

        if cls._redis_available is not False:
            try:
                keys = [cls._key(s) for s in symbols]
                raw_items = await redis_client.mget(keys)
                cls._redis_available = True
                for s, raw in zip(symbols, raw_items):
                    if raw:
                        try:
                            result[s] = Quote.model_validate_json(raw)
                        except Exception:
                            pass
                missing_symbols = [s for s in symbols if s not in result]
            except Exception as e:
                if cls._redis_available is not False:
                    logger.warning("Redis unavailable; reading from in-memory market quote fallback")
                cls._redis_available = False

        for s in missing_symbols:
            mem = cls._memory_quotes.get(s)
            if mem:
                result[s] = mem

        return result

    @classmethod
    async def get_quote(cls, symbol: str) -> Optional[Quote]:
        """Fetch single quote for requested symbol."""
        quotes = await cls.get_quotes_many([symbol])
        return quotes.get(symbol)


