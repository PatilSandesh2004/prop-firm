import logging
from decimal import Decimal
from typing import Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AccountStatus, OrderSide
from app.models.account import Account
from app.models.instrument import Instrument
from app.models.order import Order
from app.models.position import Position
from app.models.rule_version import RuleVersion
from app.services.account_service import AccountQueryService

logger = logging.getLogger(__name__)


class RiskEngine:
    @staticmethod
    async def compute_margin_requirement(
        db: AsyncSession,
        account: Account,
        instrument: Instrument,
        side: OrderSide,
        quantity: int,
        quote_ltp: Optional[Decimal],
    ) -> Tuple[Decimal, Decimal, int]:
        """
        Return (required_amount, available_amount, opening_short_qty) for a
        proposed (not yet placed) order. Shared by check_pre_trade (the actual
        gate) and the margin-preview endpoint the order ticket calls before
        submit, so the number shown to the trader always matches what would
        actually be enforced -- there is exactly one place this math lives.
        """
        stmt = select(Position).where(
            Position.account_id == account.id,
            Position.instrument_id == instrument.id,
        )
        position = (await db.execute(stmt)).scalar_one_or_none()
        held_long = position.net_quantity if position and position.net_quantity > 0 else 0

        invested_long, margin_used = await AccountQueryService.compute_open_exposure(
            db, account.id
        )

        if side == OrderSide.BUY:
            required = (
                Decimal(quantity) * quote_ltp if quote_ltp is not None else Decimal("0.00")
            )
            available = account.equity - invested_long
            return required, available, 0

        # SELL: any quantity beyond what's currently held long opens/increases a short.
        opening_short_qty = max(0, quantity - held_long)
        required = (
            AccountQueryService.margin_for_lots(instrument, opening_short_qty)
            if opening_short_qty > 0
            else Decimal("0.00")
        )
        available = account.equity - margin_used
        return required, available, opening_short_qty

    @staticmethod
    async def check_pre_trade(
        db: AsyncSession,
        account: Account,
        order: Order,
        instrument: Instrument,
        quote_ltp: Optional[Decimal],
    ) -> Tuple[bool, str]:
        """
        Validates if the account is allowed to place a new order: account status,
        cash-secured buying power for BUY, and an approximate margin gate for any
        SELL quantity that would open or increase a short position.
        """
        if account.status != AccountStatus.ACTIVE:
            return False, f"Account is not active. Current status: {account.status}"

        if quote_ltp is None:
            return False, "No live market data available to price this order"

        required, available, opening_short_qty = await RiskEngine.compute_margin_requirement(
            db, account, instrument, order.side, order.quantity, quote_ltp
        )

        if order.side == OrderSide.BUY:
            if available < required:
                return False, (
                    f"Insufficient funds: order requires approx {required:.2f}, "
                    f"available {available:.2f}"
                )
            return True, "Pre-trade checks passed"

        if opening_short_qty > 0 and available < required:
            return False, (
                f"Insufficient margin to short {opening_short_qty} units: "
                f"requires approx {required:.2f}, available {available:.2f}"
            )

        return True, "Pre-trade checks passed"

    @staticmethod
    async def check_post_trade(db: AsyncSession, account: Account) -> Tuple[bool, str]:
        """
        Evaluates the account against its assigned RuleVersion after a trade or mark-to-market update.
        Mutates the account status if a rule is breached or target is met.
        Returns (breached: bool, message: str)
        """
        # Fetch RuleVersion
        rule_version = await db.get(RuleVersion, account.rule_version_id)
        if not rule_version:
            logger.error(
                f"RuleVersion {account.rule_version_id} not found for account {account.id}"
            )
            return False, "Rules not found"

        # Check Max Daily Loss
        # daily_pnl is equity - starting_balance
        max_daily_loss_amount = account.starting_balance * (
            rule_version.max_daily_loss_percent / Decimal("100")
        )
        if account.daily_pnl < -max_daily_loss_amount:
            account.status = AccountStatus.FAILED
            msg = f"Account breached Max Daily Loss of {rule_version.max_daily_loss_percent}%."
            logger.info(f"Account {account.id} FAILED: {msg}")
            return True, msg

        # Check Max Drawdown
        if account.drawdown_percent >= rule_version.max_drawdown_percent:
            account.status = AccountStatus.FAILED
            msg = f"Account breached Max Drawdown of {rule_version.max_drawdown_percent}%."
            logger.info(f"Account {account.id} FAILED: {msg}")
            return True, msg

        # Check Profit Target (Only pass if they also hit minimum days)
        profit_target_amount = account.starting_balance * (
            rule_version.profit_target_percent / Decimal("100")
        )
        if account.realized_pnl + account.floating_pnl >= profit_target_amount:
            if account.trading_days_count >= rule_version.min_trading_days:
                account.status = AccountStatus.PASSED
                msg = f"Account achieved Profit Target of {rule_version.profit_target_percent}%."
                logger.info(f"Account {account.id} PASSED: {msg}")
                return True, msg
            else:
                logger.info(
                    f"Account {account.id} reached profit target but needs more trading days."
                )

        return False, "All risk rules satisfied"


risk_engine = RiskEngine()
