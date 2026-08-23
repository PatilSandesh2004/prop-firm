import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.constants import InstrumentType, OptionType
from app.db.base import Base
from app.models.user import utc_now


class Instrument(Base):
    __tablename__ = "instruments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    exchange: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    underlying: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    trading_symbol: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )

    instrument_type: Mapped[InstrumentType] = mapped_column(nullable=False, index=True)
    option_type: Mapped[OptionType | None] = mapped_column(nullable=True, index=True)

    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    strike_price: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2), nullable=True, index=True
    )

    lot_size: Mapped[int] = mapped_column(nullable=False)
    tick_size: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)

    broker_instrument_token: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
