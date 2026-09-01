import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import utc_now


class ChallengePackage(Base):
    __tablename__ = "challenge_packages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    account_size: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    price_inr: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    profit_target_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    max_daily_loss_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    max_drawdown_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    min_trading_days: Mapped[int] = mapped_column(default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
