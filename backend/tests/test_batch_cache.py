from datetime import datetime, timezone
from decimal import Decimal

import pytest
from app.market_data.redis_cache import MarketDataCache
from app.schemas.market_data import DepthLevel, MarketDepth, Quote


@pytest.mark.asyncio
async def test_batch_cache_set_and_get():
    depth = MarketDepth(
        symbol="NIFTY",
        bids=[DepthLevel(price=Decimal("25000.00"), quantity=100)],
        asks=[DepthLevel(price=Decimal("25001.00"), quantity=100)],
        timestamp=datetime.now(timezone.utc),
    )
    quote1 = Quote(
        symbol="NIFTY",
        ltp=Decimal("25000.00"),
        bid=Decimal("25000.00"),
        ask=Decimal("25001.00"),
        volume=1000,
        open_interest=50000,
        depth=depth,
        timestamp=datetime.now(timezone.utc),
        source="TEST",
        prev_close=Decimal("24800.00"),
        change=Decimal("200.00"),
        change_pct=Decimal("0.80"),
    )
    quote2 = Quote(
        symbol="BANKNIFTY",
        ltp=Decimal("52000.00"),
        bid=Decimal("52000.00"),
        ask=Decimal("52002.00"),
        volume=2000,
        open_interest=80000,
        depth=depth,
        timestamp=datetime.now(timezone.utc),
        source="TEST",
        prev_close=Decimal("51700.00"),
        change=Decimal("300.00"),
        change_pct=Decimal("0.58"),
    )

    await MarketDataCache.set_quotes_many([quote1, quote2])

    fetched = await MarketDataCache.get_quotes_many(["NIFTY", "BANKNIFTY", "UNKNOWN"])
    assert "NIFTY" in fetched
    assert "BANKNIFTY" in fetched
    assert "UNKNOWN" not in fetched
    assert fetched["NIFTY"].ltp == Decimal("25000.00")
    assert fetched["BANKNIFTY"].ltp == Decimal("52000.00")

    single = await MarketDataCache.get_quote("NIFTY")
    assert single is not None
    assert single.ltp == Decimal("25000.00")
