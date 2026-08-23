import logging
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.market_data.redis_cache import MarketDataCache
from app.models.account import Account
from app.models.instrument import Instrument
from app.models.position import Position

logger = logging.getLogger(__name__)


class PnLEngine:
    @staticmethod
    async def mark_to_market_account(db: AsyncSession, account: Account) -> None:
        """
        Calculates the floating PnL for all open positions of an account based on latest market data.
        Updates the account's floating_pnl, equity, and high_water_mark.
        """
        stmt = (
            select(Position, Instrument)
            .join(Instrument)
            .where(Position.account_id == account.id, Position.net_quantity != 0)
        )
        result = await db.execute(stmt)
        positions_with_instruments = result.all()

        total_floating_pnl = Decimal("0.00")

        for position, instrument in positions_with_instruments:
            # Fetch latest quote
            quote = await MarketDataCache.get_quote(instrument.trading_symbol)
            if not quote:
                logger.warning(
                    f"No market data found for {instrument.trading_symbol} during MTM"
                )
                continue

            # Use LTP for simple MTM (could use Bid/Ask depending on long/short for stricter valuation)
            current_price = quote.ltp

            # PnL = (Current Price - Entry Price) * Quantity (if LONG)
            # PnL = (Entry Price - Current Price) * Quantity (if SHORT)
            if position.net_quantity > 0:
                pnl = (
                    current_price - position.average_entry_price
                ) * position.net_quantity
            else:
                pnl = (position.average_entry_price - current_price) * abs(
                    position.net_quantity
                )

            total_floating_pnl += pnl

        # Update Account
        account.floating_pnl = total_floating_pnl
        # Equity must include realized P&L from closed/reduced positions, not
        # just the floating P&L on what's still open -- otherwise a profitable
        # close silently vanishes from equity/daily_pnl/drawdown.
        account.equity = (
            account.current_balance + account.realized_pnl + account.floating_pnl
        )
        account.daily_pnl = (
            account.equity - account.starting_balance
        )  # Simplified for POC

        # Drawdown calculations
        if account.equity > account.high_water_mark:
            account.high_water_mark = account.equity

        account.drawdown_amount = account.high_water_mark - account.equity
        if account.high_water_mark > 0:
            account.drawdown_percent = (
                account.drawdown_amount / account.high_water_mark
            ) * 100
        else:
            account.drawdown_percent = Decimal("0.00")
