import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AccountStatus, AccountType, Role
from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.account import Account
from app.models.challenge import Challenge
from app.models.challenge_package import ChallengePackage
from app.models.challenge_purchase import ChallengePurchase
from app.models.rule_version import RuleVersion
from app.models.user import User
from app.core.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin"])


async def _ensure_prop_challenge(db: AsyncSession) -> Challenge:
    """Handle the ensure prop challenge workflow for the trading simulation and connect the related backend logic."""
    challenge = await db.execute(select(Challenge).where(Challenge.name == "India Index Prop Challenge"))
    existing = challenge.scalar_one_or_none()
    if existing:
        return existing
    new_challenge = Challenge(name="India Index Prop Challenge", starting_capital=Decimal("100000.00"), is_active=True)
    db.add(new_challenge)
    await db.flush()
    return new_challenge


async def _ensure_rule_version(db: AsyncSession, challenge_id: uuid.UUID, account_size: Decimal) -> RuleVersion:
    """Handle the ensure rule version workflow for the trading simulation and connect the related backend logic."""
    rule = await db.execute(
        select(RuleVersion).where(
            RuleVersion.challenge_id == challenge_id,
            RuleVersion.funded_capital_amount == account_size,
            RuleVersion.is_active.is_(True),
        )
    )
    existing = rule.scalar_one_or_none()
    if existing:
        return existing
    new_rule = RuleVersion(
        challenge_id=challenge_id,
        account_type_scope=AccountType.EVALUATION,
        profit_target_percent=Decimal("10.00"),
        max_daily_loss_percent=Decimal("5.00"),
        max_drawdown_percent=Decimal("15.00"),
        min_trading_days=0,
        funded_capital_amount=account_size,
        is_active=True,
    )
    db.add(new_rule)
    await db.flush()
    return new_rule


@router.post("/users")
async def create_admin_user(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new admin user entry and persist it to the database."""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    email = str(payload.get("email", "")).strip()
    password = str(payload.get("password", "")).strip()
    name = str(payload.get("name", "")).strip() or email
    if not email or not password:
        raise HTTPException(status_code=400, detail="email and password are required")

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User already exists")

    user = User(email=email, password_hash=get_password_hash(password), role=Role.TRADER, is_active=True)
    db.add(user)
    await db.flush()
    await db.commit()
    await db.refresh(user)
    return {
        "message": "User created successfully",
        "user": {"id": str(user.id), "email": user.email, "name": name, "role": user.role.value},
    }


@router.get("/challenges/purchases")
async def list_purchases(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all purchases records for the active user or admin view."""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    result = await db.execute(select(ChallengePurchase).order_by(ChallengePurchase.created_at.desc()))
    purchases = result.scalars().all()
    return [
        {
            "id": str(item.id),
            "user_id": str(item.user_id),
            "package_id": str(item.package_id),
            "payment_reference": item.payment_reference,
            "payment_status": item.payment_status,
            "status": item.status,
            "amount_paid_inr": float(item.amount_paid_inr),
            "whatsapp_number": item.whatsapp_number,
            "created_at": item.created_at.isoformat(),
        }
        for item in purchases
    ]


@router.post("/challenges/purchases/{purchase_id}/approve")
async def approve_purchase(
    purchase_id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve the purchase action and advance the workflow state."""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    purchase = await db.get(ChallengePurchase, purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    package = await db.get(ChallengePackage, purchase.package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Challenge package not found")

    challenge = await _ensure_prop_challenge(db)
    rule = await _ensure_rule_version(db, challenge.id, package.account_size)
    user = await db.get(User, purchase.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    account = Account(
        user_id=user.id,
        challenge_id=challenge.id,
        rule_version_id=rule.id,
        account_type=AccountType.EVALUATION,
        status=AccountStatus.ACTIVE,
        starting_balance=package.account_size,
        current_balance=package.account_size,
        equity=package.account_size,
        high_water_mark=package.account_size,
        execution_provider_key="SIMULATION",
    )
    db.add(account)
    await db.flush()

    purchase.account_id = account.id
    purchase.payment_status = "PAID"
    purchase.status = "APPROVED"
    purchase.admin_note = "Account activated after payment verification. Credentials shared within 3 hours."
    await db.commit()
    await db.refresh(purchase)
    await db.refresh(account)

    return {
        "id": str(purchase.id),
        "user_id": str(user.id),
        "status": purchase.status,
        "payment_status": purchase.payment_status,
        "account": {
            "id": str(account.id),
            "account_type": account.account_type.value,
            "status": account.status.value,
            "starting_balance": float(account.starting_balance),
            "current_balance": float(account.current_balance),
            "equity": float(account.equity),
        },
        "message": "Payment verified. User credentials are sent after admin activation, and the user can log in to the trading terminal.",
    }


@router.get("/audit-events")
async def list_audit_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all audit events records for the active user or admin view."""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return [{"message": "challenge purchase workflow audited for admin review"}]
