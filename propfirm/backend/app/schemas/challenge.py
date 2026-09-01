import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.core.constants import AccountType


class RuleVersionBase(BaseModel):
    account_type_scope: AccountType
    profit_target_percent: Decimal
    max_daily_loss_percent: Decimal
    max_drawdown_percent: Decimal
    min_trading_days: int
    funded_capital_amount: Decimal


class RuleVersionCreate(RuleVersionBase):
    challenge_id: uuid.UUID


class RuleVersionRead(RuleVersionBase):
    id: uuid.UUID
    challenge_id: uuid.UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ChallengeBase(BaseModel):
    name: str
    starting_capital: Decimal


class ChallengeCreate(ChallengeBase):
    pass


class ChallengeRead(ChallengeBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
