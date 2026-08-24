import uuid
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Role
from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.account import Account
from app.models.instrument import Instrument
from app.models.position import Position
from app.models.user import User
from app.schemas.account import AccountRead
from app.schemas.account import AccountSummaryRead
from app.schemas.position import PositionTerminalRead
from app.services.account_service import AccountQueryService
from app.services.graduation_service import AccountGraduationService

router = APIRouter(prefix="/accounts", tags=["Accounts"])


async def _get_owned_account(
    db: AsyncSession, account_id: uuid.UUID, current_user: User
) -> Account:
    """Load an account, enforcing that it belongs to the caller (or the caller is an admin).

    Returns a plain 404 (rather than 403) for accounts owned by someone else,
    so the endpoint doesn't confirm/deny which account IDs exist to a caller
    who isn't entitled to see them.
    """
    account = await db.get(Account, account_id)
    if not account or (
        account.user_id != current_user.id and current_user.role != Role.ADMIN
    ):
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.get("", response_model=List[AccountRead])
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List accounts owned by the current user (or every account, for admins)."""
    stmt = select(Account)
    if current_user.role != Role.ADMIN:
        stmt = stmt.where(Account.user_id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{account_id}", response_model=AccountRead)
async def get_account(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch the account for the current request."""
    return await _get_owned_account(db, account_id, current_user)


@router.get("/{account_id}/summary", response_model=AccountSummaryRead)
async def get_account_summary(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch the account summary for the current request."""
    account = await _get_owned_account(db, account_id, current_user)
    return await AccountQueryService.build_summary(db, account)


@router.get("/{account_id}/positions", response_model=List[PositionTerminalRead])
async def list_positions(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all positions records for the active user or admin view."""
    account = await _get_owned_account(db, account_id, current_user)
    return await AccountQueryService.build_positions(db, account)


@router.get("/{account_id}/positions/closed", response_model=List[PositionTerminalRead])
async def list_closed_positions(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return closed option positions for the account history view."""
    await _get_owned_account(db, account_id, current_user)

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
async def graduate_account(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Handle the graduate account workflow for the trading simulation and connect the related backend logic."""
    await _get_owned_account(db, account_id, current_user)
    try:
        funded_account = await AccountGraduationService.graduate_account(db, account_id)
        return funded_account
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")
