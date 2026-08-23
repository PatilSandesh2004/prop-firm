from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AccountStatus, AccountType, Role
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.bootstrap import ensure_seed_data
from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.account import Account
from app.models.challenge import Challenge
from app.models.rule_version import RuleVersion
from app.models.user import User
from app.schemas.auth import AuthUser, LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate the user or create a new trader account and return the access token."""
    await ensure_seed_data(db)
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=AuthUser(id=str(user.id), email=user.email, role=user.role.value),
    )


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate the user or create a new trader account and return the access token."""
    existing_stmt = select(User).where(User.email == payload.email)
    existing_result = await db.execute(existing_stmt)
    existing_user = existing_result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")

    challenge_stmt = select(Challenge).where(Challenge.name == "Core Trading Sandbox")
    challenge_result = await db.execute(challenge_stmt)
    challenge = challenge_result.scalar_one_or_none()
    if not challenge:
        challenge = Challenge(
            name="Core Trading Sandbox",
            starting_capital=Decimal("500000.00"),
            is_active=True,
        )
        db.add(challenge)
        await db.flush()

    rule_stmt = select(RuleVersion).where(
        RuleVersion.challenge_id == challenge.id,
        RuleVersion.account_type_scope == AccountType.EVALUATION,
        RuleVersion.is_active == True,
    )
    rule_result = await db.execute(rule_stmt)
    rule = rule_result.scalar_one_or_none()
    if not rule:
        rule = RuleVersion(
            challenge_id=challenge.id,
            account_type_scope=AccountType.EVALUATION,
            profit_target_percent=Decimal("0.00"),
            max_daily_loss_percent=Decimal("0.00"),
            max_drawdown_percent=Decimal("0.00"),
            min_trading_days=0,
            funded_capital_amount=Decimal("500000.00"),
            is_active=True,
        )
        db.add(rule)
        await db.flush()

    user = User(
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role=Role.TRADER,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    account = Account(
        user_id=user.id,
        challenge_id=challenge.id,
        rule_version_id=rule.id,
        account_type=AccountType.EVALUATION,
        status=AccountStatus.ACTIVE,
        starting_balance=Decimal("500000.00"),
        current_balance=Decimal("500000.00"),
        equity=Decimal("500000.00"),
        high_water_mark=Decimal("500000.00"),
        execution_provider_key="SIMULATION",
    )
    db.add(account)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(str(user.id))
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=AuthUser(id=str(user.id), email=user.email, role=user.role.value),
    )


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user profile for the active session."""
    return current_user
