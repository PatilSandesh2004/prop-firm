import uuid
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.account import Account
from app.models.instrument import Instrument
from app.models.position import Position
from app.schemas.account import AccountRead
from app.schemas.account import AccountSummaryRead
from app.schemas.position import PositionTerminalRead
from app.services.account_service import AccountQueryService
from app.services.graduation_service import AccountGraduationService

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("", response_model=List[AccountRead])
async def list_accounts(db: AsyncSession = Depends(get_db)):
    """List all accounts records for the active user or admin view."""
    stmt = select(Account)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{account_id}", response_model=AccountRead)
async def get_account(account_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Fetch the account for the current request."""
    account = await db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.get("/{account_id}/summary", response_model=AccountSummaryRead)
async def get_account_summary(account_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Fetch the account summary for the current request."""
    account = await db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    return await AccountQueryService.build_summary(db, account)


@router.get("/{account_id}/positions", response_model=List[PositionTerminalRead])
async def list_positions(account_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """List all positions records for the active user or admin view."""
    account = await db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    return await AccountQueryService.build_positions(db, account)


@router.get("/{account_id}/positions/closed", response_model=List[PositionTerminalRead])
async def list_closed_positions(account_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Return closed option positions for the account history view."""
    account = await db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    stmt = (
        select(Position, Instrument)
        .join(Instrument, Position.instrument_id == Instrument.id)
        .where(Position.account_id == account_id, Position.net_quantity == 0)
    )
    result = await db.execute(stmt)
    rows = result.all()
    response: List[PositionTerminalRead] = []
    for position, instrument in rows:
        response.append(
            PositionTerminalRead(
                instrument_id=instrument.id,
                trading_symbol=instrument.trading_symbol,
                side="FLAT",
                lots=0,
                quantity=0,
                average_entry_price=position.average_entry_price,
                ltp=None,
                invested_value=Decimal("0.00"),
                current_value=Decimal("0.00"),
                realized_pnl=position.realized_pnl,
                unrealized_pnl=Decimal("0.00"),
                day_pnl=Decimal("0.00"),
                product="NRML",
                status="CLOSED",
            )
        )
    return response


@router.post("/{account_id}/graduate", response_model=AccountRead)
async def graduate_account(account_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Handle the graduate account workflow for the trading simulation and connect the related backend logic."""
    try:
        funded_account = await AccountGraduationService.graduate_account(db, account_id)
        return funded_account
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")
