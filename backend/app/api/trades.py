import uuid
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.account import Account
from app.models.instrument import Instrument
from app.models.trade import Trade
from app.models.user import User
from app.schemas.trade import TradeTerminalRead

router = APIRouter(prefix="/accounts/{account_id}/trades", tags=["Trades"])


@router.get("", response_model=List[TradeTerminalRead])
async def list_trades(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all trades records for the active user or admin view."""
    account = await db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    stmt = (
        select(Trade, Instrument)
        .join(Instrument, Trade.instrument_id == Instrument.id)
        .where(Trade.account_id == account_id)
        .order_by(Trade.created_at.desc())
    )
    result = await db.execute(stmt)

    rows = []
    for trade, instrument in result.all():
        notional = Decimal(str(trade.quantity)) * trade.price
        rows.append(
            TradeTerminalRead(
                id=trade.id,
                trading_symbol=instrument.trading_symbol,
                side=trade.side.value,
                quantity=trade.quantity,
                price=trade.price,
                notional=notional,
                created_at=trade.created_at.isoformat(),
            )
        )
    return rows
