from enum import Enum


class Role(str, Enum):
    TRADER = "TRADER"
    SUPPORT = "SUPPORT"
    COMPLIANCE = "COMPLIANCE"
    ADMIN = "ADMIN"


class AccountType(str, Enum):
    EVALUATION = "EVALUATION"
    FUNDED = "FUNDED"


class AccountStatus(str, Enum):
    PENDING_ACTIVATION = "PENDING_ACTIVATION"
    ACTIVE = "ACTIVE"
    FAILED = "FAILED"
    PASSED = "PASSED"
    SUSPENDED = "SUSPENDED"
    CLOSED = "CLOSED"


class InstrumentType(str, Enum):
    FUTURE = "FUTURE"
    OPTION = "OPTION"


class OptionType(str, Enum):
    CE = "CE"
    PE = "PE"


class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderType(str, Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    SL = "SL"
    SL_M = "SL_M"


class OrderStatus(str, Enum):
    OPEN = "OPEN"
    PENDING_TRIGGER = "PENDING_TRIGGER"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
