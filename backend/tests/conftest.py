import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

import pytest_asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.constants import AccountStatus, AccountType, InstrumentType, OptionType, Role
from app.db.base import Base
from app.market_data.redis_cache import MarketDataCache
from app.models.account import Account
from app.models.challenge import Challenge
from app.models.instrument import Instrument
from app.models.rule_version import RuleVersion
from app.models.user import User
from app.schemas.market_data import DepthLevel, MarketDepth, Quote


@pytest_asyncio.fixture
async def db_session():
    """A throwaway in-memory SQLite database, fresh for every test."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    async with session_maker() as session:
        yield session

    await engine.dispose()


async def make_account(db_session, *, starting_balance: Decimal) -> Account:
    """Create an ACTIVE evaluation account with a fresh challenge/rule set."""
    challenge = Challenge(
        name="Test Challenge", starting_capital=starting_balance, is_active=True
    )
    db_session.add(challenge)
    await db_session.flush()

    rule = RuleVersion(
        challenge_id=challenge.id,
        account_type_scope=AccountType.EVALUATION,
        profit_target_percent=Decimal("10.00"),
        max_daily_loss_percent=Decimal("5.00"),
        max_drawdown_percent=Decimal("15.00"),
        min_trading_days=0,
        funded_capital_amount=starting_balance,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.flush()

    user = User(
        email=f"trader-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="x",
        role=Role.TRADER,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    account = Account(
        user_id=user.id,
        challenge_id=challenge.id,
        rule_version_id=rule.id,
        account_type=AccountType.EVALUATION,
        status=AccountStatus.ACTIVE,
        starting_balance=starting_balance,
        current_balance=starting_balance,
        equity=starting_balance,
        high_water_mark=starting_balance,
    )
    db_session.add(account)
    await db_session.commit()
    await db_session.refresh(account)
    return account


@pytest_asyncio.fixture
async def account(db_session) -> Account:
    return await make_account(db_session, starting_balance=Decimal("100000.00"))


async def make_option_instrument(db_session, *, symbol: str, strike: Decimal, lot_size: int = 50) -> Instrument:
    instrument = Instrument(
        exchange="NFO",
        underlying="NIFTY",
        trading_symbol=symbol,
        instrument_type=InstrumentType.OPTION,
        option_type=OptionType.CE,
        expiry_date=date(2099, 12, 31),
        strike_price=strike,
        lot_size=lot_size,
        tick_size=Decimal("0.05"),
    )
    db_session.add(instrument)
    await db_session.commit()
    await db_session.refresh(instrument)
    return instrument


@pytest_asyncio.fixture
async def option_instrument(db_session) -> Instrument:
    return await make_option_instrument(
        db_session, symbol="NIFTYTESTCE", strike=Decimal("25000")
    )


async def set_quote(symbol: str, ltp, bid=None, ask=None, source: str = "TEST") -> None:
    """Inject a deterministic quote (bid == ask == ltp by default) for fills."""
    ltp = Decimal(str(ltp))
    bid = Decimal(str(bid)) if bid is not None else ltp
    ask = Decimal(str(ask)) if ask is not None else ltp
    now = datetime.now(timezone.utc)
    quote = Quote(
        symbol=symbol,
        ltp=ltp,
        bid=bid,
        ask=ask,
        volume=1000,
        open_interest=1000,
        depth=MarketDepth(
            symbol=symbol,
            bids=[DepthLevel(price=bid, quantity=100000)],
            asks=[DepthLevel(price=ask, quantity=100000)],
            timestamp=now,
        ),
        timestamp=now,
        source=source,
    )
    await MarketDataCache.set_quote(quote)
