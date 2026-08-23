from decimal import Decimal
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import AccountStatus, AccountType, InstrumentType, OptionType, Role
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.database import engine
from app.models.account import Account
from app.models.challenge import Challenge
from app.models.challenge_package import ChallengePackage
from app.models.instrument import Instrument
from app.models.rule_version import RuleVersion
from app.models.user import User


async def ensure_seed_data(db: AsyncSession) -> None:
    """Ensure the required seed data record exists before continuing the workflow."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    admin = (await db.execute(select(User).where(User.email == "admin@propfirm.co"))).scalar_one_or_none()
    if settings.ENABLE_DEMO_BOOTSTRAP and not admin:
        admin = User(
            email="admin@propfirm.co",
            password_hash=get_password_hash("Admin@123"),
            role=Role.ADMIN,
            is_active=True,
        )
        db.add(admin)
        await db.flush()

    demo_user = (await db.execute(select(User).where(User.email == settings.DEMO_TRADER_EMAIL))).scalar_one_or_none()
    if settings.ENABLE_DEMO_BOOTSTRAP and not demo_user:
        challenge = Challenge(
            name="India Index Prop Challenge",
            starting_capital=Decimal("500000.00"),
            is_active=True,
        )
        db.add(challenge)
        await db.flush()

        rule = RuleVersion(
            challenge_id=challenge.id,
            account_type_scope=AccountType.EVALUATION,
            profit_target_percent=Decimal("10.00"),
            max_daily_loss_percent=Decimal("5.00"),
            max_drawdown_percent=Decimal("15.00"),
            min_trading_days=0,
            funded_capital_amount=Decimal("500000.00"),
            is_active=True,
        )
        db.add(rule)
        await db.flush()

        demo_user = User(
            email=settings.DEMO_TRADER_EMAIL,
            password_hash=get_password_hash(settings.DEMO_TRADER_PASSWORD),
            role=Role.TRADER,
            is_active=True,
        )
        db.add(demo_user)
        await db.flush()

        db.add(
            Account(
                user_id=demo_user.id,
                challenge_id=challenge.id,
                rule_version_id=rule.id,
                account_type=AccountType.EVALUATION,
                status=AccountStatus.ACTIVE,
                starting_balance=Decimal("50000.00"),
                current_balance=Decimal("50000.00"),
                equity=Decimal("50000.00"),
                high_water_mark=Decimal("50000.00"),
                execution_provider_key="SIMULATED",
            )
        )

    package_exists = (await db.execute(select(ChallengePackage).limit(1))).scalar_one_or_none()
    if settings.ENABLE_DEMO_BOOTSTRAP and not package_exists:
        db.add_all(
            [
                ChallengePackage(
                    name="50K Account",
                    account_size=Decimal("50000.00"),
                    price_inr=Decimal("5000.00"),
                    profit_target_percent=Decimal("10.00"),
                    max_daily_loss_percent=Decimal("5.00"),
                    max_drawdown_percent=Decimal("15.00"),
                    min_trading_days=0,
                    is_active=True,
                ),
                ChallengePackage(
                    name="100K Account",
                    account_size=Decimal("100000.00"),
                    price_inr=Decimal("10000.00"),
                    profit_target_percent=Decimal("10.00"),
                    max_daily_loss_percent=Decimal("5.00"),
                    max_drawdown_percent=Decimal("15.00"),
                    min_trading_days=0,
                    is_active=True,
                ),
            ]
        )

    instrument_exists = (await db.execute(select(Instrument).limit(1))).scalar_one_or_none()
    if settings.ENABLE_DEMO_BOOTSTRAP and not instrument_exists:
        expiry = date(2026, 8, 27)
        instruments = [
            Instrument(
                exchange="NSE",
                underlying="NIFTY",
                trading_symbol="NIFTY-FUT",
                instrument_type=InstrumentType.FUTURE,
                expiry_date=expiry,
                lot_size=50,
                tick_size=Decimal("0.05"),
            ),
            Instrument(
                exchange="NSE",
                underlying="BANKNIFTY",
                trading_symbol="BANKNIFTY-FUT",
                instrument_type=InstrumentType.FUTURE,
                expiry_date=expiry,
                lot_size=15,
                tick_size=Decimal("0.05"),
            ),
            Instrument(
                exchange="BSE",
                underlying="SENSEX",
                trading_symbol="SENSEX-FUT",
                instrument_type=InstrumentType.FUTURE,
                expiry_date=expiry,
                lot_size=10,
                tick_size=Decimal("0.05"),
            ),
            Instrument(
                exchange="NSE",
                underlying="FINNIFTY",
                trading_symbol="FINNIFTY-FUT",
                instrument_type=InstrumentType.FUTURE,
                expiry_date=expiry,
                lot_size=40,
                tick_size=Decimal("0.05"),
            ),
            Instrument(
                exchange="NSE",
                underlying="MIDCAPNIFTY",
                trading_symbol="MIDCAPNIFTY-FUT",
                instrument_type=InstrumentType.FUTURE,
                expiry_date=expiry,
                lot_size=75,
                tick_size=Decimal("0.05"),
            ),
        ]

        for strike in [24500, 24600, 24700, 24800, 24900, 25000, 25100, 25200, 25300, 25400]:
            instruments.append(
                Instrument(
                    exchange="NFO",
                    underlying="NIFTY",
                    trading_symbol=f"NIFTY{expiry.strftime('%y%b').upper()}{strike}CE",
                    instrument_type=InstrumentType.OPTION,
                    option_type=OptionType.CE,
                    expiry_date=expiry,
                    strike_price=Decimal(str(strike)),
                    lot_size=50,
                    tick_size=Decimal("0.05"),
                )
            )
            instruments.append(
                Instrument(
                    exchange="NFO",
                    underlying="NIFTY",
                    trading_symbol=f"NIFTY{expiry.strftime('%y%b').upper()}{strike}PE",
                    instrument_type=InstrumentType.OPTION,
                    option_type=OptionType.PE,
                    expiry_date=expiry,
                    strike_price=Decimal(str(strike)),
                    lot_size=50,
                    tick_size=Decimal("0.05"),
                )
            )

        db.add_all(instruments)

    await db.commit()
