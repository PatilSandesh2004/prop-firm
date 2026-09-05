import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import InstrumentType, OrderSide, Role
from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.market_data.redis_cache import MarketDataCache
from app.models.account import Account
from app.models.instrument import Instrument
from app.models.order import Order
from app.models.user import User
from app.risk.engine import risk_engine
from app.schemas.order import MarginPreviewRead, OrderCreate, OrderRead
from app.services.order_service import OrderService

router = APIRouter(prefix="/accounts/{account_id}/orders", tags=["Orders"])


async def _assert_account_owner(
    db: AsyncSession, account_id: uuid.UUID, current_user: User
) -> None:
    """Raise 404 unless the account exists and belongs to the caller (or caller is admin)."""
    account = await db.get(Account, account_id)
    if not account or (
        account.user_id != current_user.id and current_user.role != Role.ADMIN
    ):
        raise HTTPException(status_code=404, detail="Account not found")


@router.post("", response_model=OrderRead)
async def place_order(
    account_id: uuid.UUID,
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Place a new order request and route it through the execution flow."""
    await _assert_account_owner(db, account_id, current_user)
    try:
        order = await OrderService.place_order(db, account_id, order_in)
        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Order execution failed: {exc}") from exc


@router.get("/margin-preview", response_model=MarginPreviewRead)
async def margin_preview(
    account_id: uuid.UUID,
    instrument_id: uuid.UUID = Query(...),
    side: OrderSide = Query(...),
    quantity: int = Query(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Preview the required/available margin for a not-yet-placed order.

    Uses the exact same computation check_pre_trade enforces at submit time
    (RiskEngine.compute_margin_requirement), so what the order ticket shows
    the trader beforehand always matches what would actually be rejected.
    """
    await _assert_account_owner(db, account_id, current_user)

    account = await db.get(Account, account_id)
    instrument = await db.get(Instrument, instrument_id)
    if not instrument or instrument.instrument_type != InstrumentType.OPTION:
        raise HTTPException(status_code=404, detail="Instrument not found")

    quote = await MarketDataCache.get_quote(instrument.trading_symbol)
    quote_ltp = quote.ltp if quote else None

    required, available, _ = await risk_engine.compute_margin_requirement(
        db, account, instrument, side, quantity, quote_ltp
    )
    return MarginPreviewRead(
        required_amount=required,
        available_amount=available,
        sufficient=available >= required,
        ltp=quote_ltp,
    )


@router.get("", response_model=List[OrderRead])
async def list_orders(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all orders records for the active user or admin view."""
    await _assert_account_owner(db, account_id, current_user)
    stmt = select(Order).where(Order.account_id == account_id).order_by(Order.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
