from decimal import Decimal

import pytest

from app.core.constants import OrderSide, OrderStatus, OrderType
from app.models.position import Position
from app.schemas.order import OrderCreate
from app.services.order_service import OrderService
from sqlalchemy import select

from .conftest import make_account, make_option_instrument, set_quote


async def _get_position(db_session, account_id, instrument_id) -> Position | None:
    stmt = select(Position).where(
        Position.account_id == account_id, Position.instrument_id == instrument_id
    )
    return (await db_session.execute(stmt)).scalar_one_or_none()


@pytest.mark.asyncio
async def test_buy_fills_at_ltp_and_creates_long_position(db_session, account, option_instrument):
    await set_quote(option_instrument.trading_symbol, ltp=100)

    order = await OrderService.place_order(
        db_session,
        account.id,
        OrderCreate(
            instrument_id=option_instrument.id,
            side=OrderSide.BUY,
            order_type=OrderType.MARKET,
            quantity=50,
        ),
    )

    assert order.status == OrderStatus.FILLED
    assert order.average_price == Decimal("100")

    position = await _get_position(db_session, account.id, option_instrument.id)
    assert position is not None
    assert position.net_quantity == 50
    assert position.average_entry_price == Decimal("100")

    await db_session.refresh(account)
    # No price movement yet: equity should be unchanged from starting balance.
    assert account.equity == Decimal("100000.00")


@pytest.mark.asyncio
async def test_close_long_realizes_pnl_into_equity(db_session, account, option_instrument):
    await set_quote(option_instrument.trading_symbol, ltp=100)
    await OrderService.place_order(
        db_session,
        account.id,
        OrderCreate(
            instrument_id=option_instrument.id,
            side=OrderSide.BUY,
            order_type=OrderType.MARKET,
            quantity=50,
        ),
    )

    # Price rallies, then the position is fully closed.
    await set_quote(option_instrument.trading_symbol, ltp=120)
    close_order = await OrderService.place_order(
        db_session,
        account.id,
        OrderCreate(
            instrument_id=option_instrument.id,
            side=OrderSide.SELL,
            order_type=OrderType.MARKET,
            quantity=50,
        ),
    )

    assert close_order.status == OrderStatus.FILLED
    position = await _get_position(db_session, account.id, option_instrument.id)
    assert position.net_quantity == 0
    assert position.realized_pnl == Decimal("1000")  # (120 - 100) * 50

    await db_session.refresh(account)
    assert account.realized_pnl == Decimal("1000")
    # This is the equity-formula regression guard: realized P&L from a closed
    # position must reach equity, not just floating_pnl on what's still open.
    assert account.equity == Decimal("101000.00")


@pytest.mark.asyncio
async def test_reopening_after_a_full_close_does_not_crash(db_session, account, option_instrument):
    """Regression guard for the missing `Decimal` import in order_service.py."""
    await set_quote(option_instrument.trading_symbol, ltp=100)
    await OrderService.place_order(
        db_session, account.id,
        OrderCreate(instrument_id=option_instrument.id, side=OrderSide.BUY, order_type=OrderType.MARKET, quantity=50),
    )
    await OrderService.place_order(
        db_session, account.id,
        OrderCreate(instrument_id=option_instrument.id, side=OrderSide.SELL, order_type=OrderType.MARKET, quantity=50),
    )

    reopen_order = await OrderService.place_order(
        db_session, account.id,
        OrderCreate(instrument_id=option_instrument.id, side=OrderSide.BUY, order_type=OrderType.MARKET, quantity=50),
    )

    assert reopen_order.status == OrderStatus.FILLED
    position = await _get_position(db_session, account.id, option_instrument.id)
    assert position.net_quantity == 50
    assert position.average_entry_price == Decimal("100")


@pytest.mark.asyncio
async def test_sell_without_a_long_position_is_blocked_by_margin(db_session, option_instrument):
    small_account = await make_account(db_session, starting_balance=Decimal("100000.00"))
    await set_quote(option_instrument.trading_symbol, ltp=100)

    with pytest.raises(ValueError, match="Insufficient margin"):
        await OrderService.place_order(
            db_session, small_account.id,
            OrderCreate(instrument_id=option_instrument.id, side=OrderSide.SELL, order_type=OrderType.MARKET, quantity=50),
        )


@pytest.mark.asyncio
async def test_sell_opens_a_short_when_margin_is_sufficient_and_buy_covers_it(db_session, option_instrument):
    funded_account = await make_account(db_session, starting_balance=Decimal("300000.00"))
    await set_quote(option_instrument.trading_symbol, ltp=100)

    short_order = await OrderService.place_order(
        db_session, funded_account.id,
        OrderCreate(instrument_id=option_instrument.id, side=OrderSide.SELL, order_type=OrderType.MARKET, quantity=50),
    )
    assert short_order.status == OrderStatus.FILLED

    position = await _get_position(db_session, funded_account.id, option_instrument.id)
    assert position.net_quantity == -50
    assert position.average_entry_price == Decimal("100")

    # Price drops -- good for the short -- then it's covered.
    await set_quote(option_instrument.trading_symbol, ltp=80)
    cover_order = await OrderService.place_order(
        db_session, funded_account.id,
        OrderCreate(instrument_id=option_instrument.id, side=OrderSide.BUY, order_type=OrderType.MARKET, quantity=50),
    )

    assert cover_order.status == OrderStatus.FILLED
    position = await _get_position(db_session, funded_account.id, option_instrument.id)
    assert position.net_quantity == 0
    assert position.realized_pnl == Decimal("1000")  # (100 - 80) * 50

    await db_session.refresh(funded_account)
    assert funded_account.realized_pnl == Decimal("1000")
    assert funded_account.equity == Decimal("301000.00")


@pytest.mark.asyncio
async def test_buy_beyond_available_funds_is_rejected(db_session, option_instrument):
    poor_account = await make_account(db_session, starting_balance=Decimal("1000.00"))
    await set_quote(option_instrument.trading_symbol, ltp=100)

    with pytest.raises(ValueError, match="Insufficient funds"):
        await OrderService.place_order(
            db_session, poor_account.id,
            OrderCreate(instrument_id=option_instrument.id, side=OrderSide.BUY, order_type=OrderType.MARKET, quantity=50),
        )
