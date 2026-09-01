import uuid
from decimal import Decimal

from pydantic import BaseModel

from .common import TimestampSchema


class PositionRead(TimestampSchema):
    id: uuid.UUID
    account_id: uuid.UUID
    instrument_id: uuid.UUID
    net_quantity: int
    average_entry_price: Decimal
    realized_pnl: Decimal


class PositionTerminalRead(BaseModel):
    instrument_id: uuid.UUID
    trading_symbol: str
    side: str
    lots: int
    quantity: int
    average_entry_price: Decimal
    ltp: Decimal | None = None
    invested_value: Decimal
    current_value: Decimal
    realized_pnl: Decimal
    unrealized_pnl: Decimal
    day_pnl: Decimal
    product: str
    status: str
