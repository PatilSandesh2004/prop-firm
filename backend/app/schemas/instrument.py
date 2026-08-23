import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel

from app.core.constants import InstrumentType, OptionType

from .common import TimestampSchema


class InstrumentBase(BaseModel):
    exchange: str
    underlying: str
    trading_symbol: str
    instrument_type: InstrumentType
    option_type: OptionType | None = None
    expiry_date: date | None = None
    strike_price: Decimal | None = None
    lot_size: int
    tick_size: Decimal
    broker_instrument_token: str | None = None


class InstrumentCreate(InstrumentBase):
    pass


class InstrumentRead(InstrumentBase, TimestampSchema):
    id: uuid.UUID
