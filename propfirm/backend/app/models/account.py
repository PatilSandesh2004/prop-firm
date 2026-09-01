import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.constants import AccountStatus, AccountType
from app.db.base import Base
from app.models.user import utc_now


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    challenge_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("challenges.id"), nullable=False
    )
    rule_version_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("rule_versions.id"), nullable=False
    )

    # Optional linking to the source evaluation account if this is a FUNDED account
    source_evaluation_account_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("accounts.id"), nullable=True
    )

    account_type: Mapped[AccountType] = mapped_column(nullable=False)
    status: Mapped[AccountStatus] = mapped_column(
        default=AccountStatus.PENDING_ACTIVATION, nullable=False
    )

    # Balances and Tracking
    starting_balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    current_balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    equity: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)

    realized_pnl: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00"), nullable=False
    )
    floating_pnl: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00"), nullable=False
    )
    daily_pnl: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00"), nullable=False
    )

    # Risk Metrics
    high_water_mark: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    drawdown_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00"), nullable=False
    )
    drawdown_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("0.00"), nullable=False
    )

    trading_days_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # External Execution Provider mapping
    execution_provider_key: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    broker_account_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
