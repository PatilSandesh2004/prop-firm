import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.core.constants import AccountType
from app.db.base import Base
from app.models.user import utc_now


class RuleVersion(Base):
    __tablename__ = "rule_versions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    challenge_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("challenges.id"), nullable=False
    )
    account_type_scope: Mapped[AccountType] = mapped_column(nullable=False)

    profit_target_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )
    max_daily_loss_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )
    max_drawdown_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    min_trading_days: Mapped[int] = mapped_column(Integer, nullable=False)
    funded_capital_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
