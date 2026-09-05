import uuid
from decimal import Decimal

from pydantic import BaseModel

from app.core.constants import OrderSide, OrderStatus, OrderType

from .common import TimestampSchema


class OrderBase(BaseModel):
    instrument_id: uuid.UUID
    side: OrderSide
    order_type: OrderType
    quantity: int
    price: Decimal | None = None
    trigger_price: Decimal | None = None


class OrderCreate(OrderBase):
    pass


class OrderRead(OrderBase, TimestampSchema):
    id: uuid.UUID
    account_id: uuid.UUID
    status: OrderStatus
    filled_quantity: int
    average_price: Decimal | None = None
    rejection_reason: str | None = None
    broker_order_id: str | None = None


class MarginPreviewRead(BaseModel):
    """What placing this exact order would require/leave, computed with the
    same math check_pre_trade enforces -- shown in the order ticket before
    submit so a rejection is never a surprise."""

    required_amount: Decimal
    available_amount: Decimal
    sufficient: bool
    ltp: Decimal | None = None
