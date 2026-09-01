import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Role
from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.account import Account
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead
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
