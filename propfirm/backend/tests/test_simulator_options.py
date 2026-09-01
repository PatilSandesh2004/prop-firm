from decimal import Decimal

import pytest

from app.core.constants import OptionType
from app.market_data.redis_cache import MarketDataCache
from app.market_data.simulator import SimulatedMarketDataProvider

from .conftest import make_option_instrument


def test_synthetic_ltp_includes_intrinsic_value_for_itm_call():
    sim = SimulatedMarketDataProvider()
    instrument = _FakeInstrument(
        underlying="NIFTY", strike=Decimal("24500"), option_type=OptionType.CE, tick_size=Decimal("0.05")
    )
    ltp = sim._synthetic_option_ltp(Decimal("25000"), instrument)
    # 500 points in-the-money -- the premium must be at least the intrinsic value.
    assert ltp >= Decimal("500")


def test_synthetic_ltp_is_quantized_to_tick_size():
    sim = SimulatedMarketDataProvider()
    instrument = _FakeInstrument(
        underlying="NIFTY", strike=Decimal("25000"), option_type=OptionType.PE, tick_size=Decimal("0.05")
    )
    ltp = sim._synthetic_option_ltp(Decimal("24980"), instrument)
    remainder = (ltp / Decimal("0.05")) % 1
    assert remainder == 0


def test_synthetic_ltp_never_goes_to_zero_or_negative():
    sim = SimulatedMarketDataProvider()
    # Deep out-of-the-money put: intrinsic is 0, but there must still be a
    # positive (tick-size-floored) price -- a real option chain never shows 0.
    instrument = _FakeInstrument(
        underlying="NIFTY", strike=Decimal("10000"), option_type=OptionType.PE, tick_size=Decimal("0.05")
    )
    ltp = sim._synthetic_option_ltp(Decimal("25000"), instrument)
    assert ltp > Decimal("0")


class _FakeInstrument:
    def __init__(self, *, underlying, strike, option_type, tick_size):
        self.underlying = underlying
        self.strike_price = strike
        self.option_type = option_type
        self.tick_size = tick_size
        self.trading_symbol = f"{underlying}TEST{strike}{option_type.value}"


@pytest.mark.asyncio
async def test_refresh_option_instruments_picks_up_seeded_options(db_session, monkeypatch):
    instrument = await make_option_instrument(db_session, symbol="NIFTYSIMTEST1CE", strike=Decimal("25000"))

    # db_session is a live AsyncSession, not a context-manager factory; wrap it
    # so `async with async_session_maker() as db` works against it in tests.
    monkeypatch.setattr(
        "app.market_data.simulator.async_session_maker",
        lambda: _SessionCtx(db_session),
    )

    sim = SimulatedMarketDataProvider()
    await sim._refresh_option_instruments()

    symbols = {inst.trading_symbol for inst in sim._option_instruments}
    assert instrument.trading_symbol in symbols


@pytest.mark.asyncio
async def test_price_options_sets_a_live_quote_from_underlying_spot(db_session, monkeypatch):
    instrument = await make_option_instrument(db_session, symbol="NIFTYSIMTEST2CE", strike=Decimal("25000"))

    monkeypatch.setattr(
        "app.market_data.simulator.async_session_maker",
        lambda: _SessionCtx(db_session),
    )

    sim = SimulatedMarketDataProvider()
    sim.market_state["NIFTY-FUT"] = Decimal("25100.00")
    await sim._refresh_option_instruments()
    await sim._price_options(tick_count=1)

    quote = await MarketDataCache.get_quote(instrument.trading_symbol)
    assert quote is not None
    assert quote.ltp > Decimal("0")


class _SessionCtx:
    """Wraps an already-open AsyncSession so `async with factory() as db` works in tests."""

    def __init__(self, session):
        self._session = session

    async def __aenter__(self):
        return self._session

    async def __aexit__(self, *exc_info):
        return False
