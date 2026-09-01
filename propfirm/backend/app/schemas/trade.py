import uuid
from decimal import Decimal

from pydantic import BaseModel

from app.core.constants import OrderSide

from .common import TimestampSchema


class TradeRead(TimestampSchema):
    id: uuid.UUID
    account_id: uuid.UUID
    order_id: uuid.UUID
    instrument_id: uuid.UUID
    side: OrderSide
    quantity: int
    price: Decimal


class TradeTerminalRead(BaseModel):
    id: uuid.UUID
    trading_symbol: str
    side: str
    quantity: int
    price: Decimal
    notional: Decimal
    created_at: str
