import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.constants import OrderSide, OrderStatus, OrderType
from app.db.base import Base
from app.models.user import utc_now


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("accounts.id"), nullable=False, index=True
    )
    instrument_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("instruments.id"), nullable=False, index=True
    )

    side: Mapped[OrderSide] = mapped_column(nullable=False)
    order_type: Mapped[OrderType] = mapped_column(nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        default=OrderStatus.OPEN, nullable=False, index=True
    )

    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    filled_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    price: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    trigger_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    average_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)

    rejection_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    broker_order_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
