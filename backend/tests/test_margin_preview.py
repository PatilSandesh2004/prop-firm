from decimal import Decimal

import pytest

from app.core.constants import OrderSide
from app.risk.engine import risk_engine
from app.services.account_service import AccountQueryService

from .conftest import set_quote


@pytest.mark.asyncio
async def test_buy_requirement_is_quantity_times_ltp(db_session, account, option_instrument):
    # account fixture starts with equity=100000.00 and no open positions.
    required, available, opening_short_qty = await risk_engine.compute_margin_requirement(
        db_session, account, option_instrument, OrderSide.BUY, quantity=50, quote_ltp=Decimal("100")
    )
    assert required == Decimal("5000")  # 50 units * 100
    assert available == account.equity
    assert opening_short_qty == 0


@pytest.mark.asyncio
async def test_sell_opening_a_short_requires_the_same_margin_check_pre_trade_uses(
    db_session, account, option_instrument
):
    required, available, opening_short_qty = await risk_engine.compute_margin_requirement(
        db_session, account, option_instrument, OrderSide.SELL, quantity=50, quote_ltp=Decimal("100")
    )
    assert opening_short_qty == 50
    assert required == AccountQueryService.margin_for_lots(option_instrument, 50)
    assert available == account.equity


@pytest.mark.asyncio
async def test_margin_preview_matches_check_pre_trade_sufficiency(db_session, account, option_instrument):
    # Regression guard for the refactor: the preview a trader sees before
    # submitting must never disagree with what check_pre_trade actually
    # enforces at submit time -- they now share one function, but this
    # pins the observable behavior in case that ever changes again.
    await set_quote(option_instrument.trading_symbol, ltp=100)

    from app.models.order import Order
    from app.core.constants import OrderStatus, OrderType

    order = Order(
        account_id=account.id,
        instrument_id=option_instrument.id,
        side=OrderSide.SELL,
        order_type=OrderType.MARKET,
        quantity=50,
        status=OrderStatus.OPEN,
    )

    required, available, _ = await risk_engine.compute_margin_requirement(
        db_session, account, option_instrument, OrderSide.SELL, quantity=50, quote_ltp=Decimal("100")
    )
    preview_sufficient = available >= required

    passed, message = await risk_engine.check_pre_trade(
        db_session, account, order, option_instrument, quote_ltp=Decimal("100")
    )

    assert preview_sufficient == passed
    if not passed:
        assert "Insufficient margin" in message
