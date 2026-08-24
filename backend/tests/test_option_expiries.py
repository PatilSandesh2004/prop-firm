from decimal import Decimal

import pytest

from app.market_data.upstox import upstox_provider
from app.services.option_chain_service import OptionChainService

from .conftest import make_option_instrument


@pytest.fixture(autouse=True)
def force_simulator_mode(monkeypatch):
    # This machine's root .env happens to carry a live Upstox access token,
    # which would otherwise route these tests into the live-API branch.
    # Force the DB-fallback (SIMULATOR) branch so the test is deterministic
    # regardless of what's configured in the ambient environment.
    monkeypatch.setattr(upstox_provider, "access_token", None)


@pytest.mark.asyncio
async def test_get_expiries_returns_seeded_option_dates_in_simulator_mode(db_session):
    # Regression test: this call used to go straight to the live Upstox SDK
    # regardless of MARKET_DATA_SOURCE, so in SIMULATOR mode (upstox_provider
    # never connect()-ed, its background event loop is None) it raised
    # AttributeError -> 500 on every call. Since the frontend fetches
    # expiries before it can request an option chain, that 500 meant the
    # option chain never loaded for any index in SIMULATOR mode.
    instrument = await make_option_instrument(db_session, symbol="NIFTYEXPTEST1CE", strike=Decimal("25000"))

    expiries = await OptionChainService.get_expiries(db_session, instrument.underlying)

    assert expiries == ["2099-12-31"]


@pytest.mark.asyncio
async def test_get_expiries_returns_empty_list_for_underlying_with_no_options(db_session):
    expiries = await OptionChainService.get_expiries(db_session, "MIDCAPNIFTY")
    assert expiries == []
