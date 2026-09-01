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

router = APIRouter(prefix="/challenges", tags=["Challenges"])


@router.get("/packages")
async def list_challenge_packages(db: AsyncSession = Depends(get_db)):
    """List all challenge packages records for the active user or admin view."""
    result = await db.execute(
        select(ChallengePackage).where(ChallengePackage.is_active.is_(True)).order_by(ChallengePackage.account_size)
    )
    packages = result.scalars().all()
    return [
        {
            "id": str(pkg.id),
            "name": pkg.name,
            "account_size": float(pkg.account_size),
            "price_inr": float(pkg.price_inr),
            "profit_target_percent": float(pkg.profit_target_percent),
            "max_daily_loss_percent": float(pkg.max_daily_loss_percent),
            "max_drawdown_percent": float(pkg.max_drawdown_percent),
            "min_trading_days": pkg.min_trading_days,
        }
        for pkg in packages
    ]


@router.post("/purchase")
async def purchase_challenge(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Handle the purchase challenge workflow for the trading simulation and connect the related backend logic."""
    package_id = payload.get("package_id")
    payment_reference = payload.get("payment_reference", "").strip()
    if not package_id:
        raise HTTPException(status_code=400, detail="package_id is required")
    if not payment_reference:
        raise HTTPException(status_code=400, detail="payment_reference is required")

    package = await db.get(ChallengePackage, uuid.UUID(package_id))
    if not package or not package.is_active:
        raise HTTPException(status_code=404, detail="Challenge package not found")

    purchase = ChallengePurchase(
        user_id=current_user.id,
        package_id=package.id,
        payment_reference=payment_reference,
        amount_paid_inr=package.price_inr,
        payment_status="PENDING",
        status="PENDING_VERIFICATION",
        whatsapp_number="6363228352",
    )
    db.add(purchase)
    await db.commit()
    await db.refresh(purchase)

    return {
        "id": str(purchase.id),
        "user_id": str(current_user.id),
        "package_id": str(package.id),
        "amount_inr": float(package.price_inr),
        "account_size": float(package.account_size),
        "status": purchase.status,
        "payment_status": purchase.payment_status,
        "qr_code_url": "https://example.com/qr/propfirm-india",
        "payment_instruction": "Please share the payment receipt to WhatsApp 6363228352 to activate and verify the account. Credentials will be shared within 3 hours.",
    }


@router.get("/my-purchases")
async def my_purchases(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Handle the my purchases workflow for the trading simulation and connect the related backend logic."""
    result = await db.execute(
        select(ChallengePurchase).where(ChallengePurchase.user_id == current_user.id).order_by(ChallengePurchase.created_at.desc())
    )
    purchases = result.scalars().all()
    return [
        {
            "id": str(item.id),
            "package_id": str(item.package_id),
            "status": item.status,
            "payment_status": item.payment_status,
            "amount_paid_inr": float(item.amount_paid_inr),
            "payment_reference": item.payment_reference,
            "whatsapp_number": item.whatsapp_number,
        }
        for item in purchases
    ]


@router.get("/admin/verify")
async def admin_verify_challenge_route(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Handle the admin verify challenge route workflow for the trading simulation and connect the related backend logic."""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    result = await db.execute(select(ChallengePurchase).order_by(ChallengePurchase.created_at.desc()))
    return [
        {
            "id": str(item.id),
            "user_id": str(item.user_id),
            "status": item.status,
            "payment_status": item.payment_status,
            "amount_paid_inr": float(item.amount_paid_inr),
            "payment_reference": item.payment_reference,
        }
        for item in result.scalars().all()
    ]
