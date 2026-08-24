import uuid
from decimal import Decimal

import pytest
from sqlalchemy import select

from app.api.auth import register
from app.core.constants import OrderSide, OrderStatus, OrderType
from app.models.account import Account
from app.risk.engine import risk_engine
from app.schemas.auth import RegisterRequest
from app.schemas.order import OrderCreate
from app.services.order_service import OrderService

from .conftest import make_option_instrument, set_quote


@pytest.mark.asyncio
async def test_self_registered_account_survives_a_winning_first_trade(db_session):
    # Regression test: /auth/register used to seed its EVALUATION RuleVersion
    # with max_daily_loss_percent=0 and max_drawdown_percent=0. Since
    # check_post_trade fails the account when drawdown_percent (0 with no
    # open loss) >= max_drawdown_percent (0), that comparison was trivially
    # true -- every self-registered account failed on its very first
    # post-trade check, regardless of whether the trade won or lost.
    email = f"reg-{uuid.uuid4().hex[:8]}@propfirmqa.co.in"
    token_response = await register(RegisterRequest(email=email, password="Passw0rd!23"), db_session)

    account = (
        await db_session.execute(
            select(Account).where(Account.user_id == uuid.UUID(token_response.user.id))
        )
    ).scalar_one()

    instrument = await make_option_instrument(db_session, symbol="NIFTYREGTEST1CE", strike=Decimal("25000"))
    await set_quote(instrument.trading_symbol, ltp=100)

    order = await OrderService.place_order(
        db_session,
        account.id,
        OrderCreate(
            instrument_id=instrument.id,
            side=OrderSide.BUY,
            order_type=OrderType.MARKET,
            quantity=50,
        ),
    )
    assert order.status == OrderStatus.FILLED

    # Price ticks up -- a winning position, zero drawdown.
    await set_quote(instrument.trading_symbol, ltp=110)
    from app.services.pnl_service import PnLEngine

    await db_session.refresh(account)
    await PnLEngine.mark_to_market_account(db_session, account)
    breached, message = await risk_engine.check_post_trade(db_session, account)

    assert not breached, f"a winning trade should never breach risk rules: {message}"
    assert account.status.value == "ACTIVE"
