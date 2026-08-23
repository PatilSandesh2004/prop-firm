import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderRead
from app.services.order_service import OrderService

router = APIRouter(prefix="/accounts/{account_id}/orders", tags=["Orders"])


@router.post("", response_model=OrderRead)
async def place_order(
    account_id: uuid.UUID, order_in: OrderCreate, db: AsyncSession = Depends(get_db)
):
    """Place a new order request and route it through the execution flow."""
    try:
        order = await OrderService.place_order(db, account_id, order_in)
        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Order execution failed: {exc}") from exc


@router.get("", response_model=List[OrderRead])
async def list_orders(account_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """List all orders records for the active user or admin view."""
    stmt = select(Order).where(Order.account_id == account_id).order_by(Order.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
