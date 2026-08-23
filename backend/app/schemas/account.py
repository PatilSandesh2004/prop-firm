import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.core.constants import AccountStatus, AccountType

from .common import TimestampSchema


class AccountBase(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})

    user_id: uuid.UUID
    challenge_id: uuid.UUID
    rule_version_id: uuid.UUID
    account_type: AccountType


class AccountCreate(AccountBase):
    source_evaluation_account_id: uuid.UUID | None = None
    starting_balance: Decimal


class AccountRead(AccountBase, TimestampSchema):
    id: uuid.UUID
    status: AccountStatus

    current_balance: Decimal
    equity: Decimal
    realized_pnl: Decimal
    floating_pnl: Decimal
    daily_pnl: Decimal

    high_water_mark: Decimal
    drawdown_amount: Decimal
    drawdown_percent: Decimal
    trading_days_count: int

    source_evaluation_account_id: uuid.UUID | None
    execution_provider_key: str | None
    broker_account_ref: str | None


class AccountSummaryRead(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})

    account_id: uuid.UUID
    balance: Decimal
    equity: Decimal
    funds_used: Decimal
    current_value: Decimal
    realized_pnl: Decimal
    unrealized_pnl: Decimal
    day_pnl: Decimal
    total_pnl: Decimal
