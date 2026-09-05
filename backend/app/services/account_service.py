import uuid
from decimal import Decimal
from typing import List, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.market_data.redis_cache import MarketDataCache
from app.models.account import Account
from app.models.instrument import Instrument
from app.models.position import Position
from app.schemas.account import AccountSummaryRead
from app.schemas.position import PositionTerminalRead


class AccountQueryService:
    @staticmethod
    async def build_summary(db: AsyncSession, account: Account) -> AccountSummaryRead:
        """Build the account summary used by the terminal to show balance, equity, and P&L."""
        stmt = (
            select(Position, Instrument)
            .join(Instrument, Position.instrument_id == Instrument.id)
            .where(Position.account_id == account.id, Position.net_quantity != 0)
        )
        result = await db.execute(stmt)
        rows = result.all()

        invested_value = Decimal("0.00")
        current_value = Decimal("0.00")
        unrealized_pnl = Decimal("0.00")

        symbols = [inst.trading_symbol for _, inst in rows]
        quotes_map = await MarketDataCache.get_quotes_many(symbols)

        for position, instrument in rows:
            qty_abs = abs(position.net_quantity)
            invested_value += Decimal(str(qty_abs)) * position.average_entry_price

            quote = quotes_map.get(instrument.trading_symbol)
            if quote:
                ltp = quote.ltp
                current_value += Decimal(str(qty_abs)) * ltp
                if position.net_quantity > 0:
                    unrealized_pnl += (
                        ltp - position.average_entry_price
                    ) * position.net_quantity
                else:
                    unrealized_pnl += (position.average_entry_price - ltp) * qty_abs

        return AccountSummaryRead(
            account_id=account.id,
            balance=account.current_balance,
            equity=account.equity,
            funds_used=invested_value,
            current_value=current_value,
            realized_pnl=account.realized_pnl,
            unrealized_pnl=unrealized_pnl,
            day_pnl=account.daily_pnl,
            total_pnl=account.realized_pnl + unrealized_pnl,
        )

    @staticmethod
    async def build_positions(db: AsyncSession, account: Account) -> List[PositionTerminalRead]:
        """Build the live position payload shown in the trading terminal."""
        stmt = (
            select(Position, Instrument)
            .join(Instrument, Position.instrument_id == Instrument.id)
            .where(Position.account_id == account.id)
        )
        result = await db.execute(stmt)
        rows = result.all()

        symbols = [inst.trading_symbol for _, inst in rows]
        quotes_map = await MarketDataCache.get_quotes_many(symbols)

        response: List[PositionTerminalRead] = []
        for position, instrument in rows:
            qty_abs = abs(position.net_quantity)
            side = (
                "LONG"
                if position.net_quantity > 0
                else "SHORT" if position.net_quantity < 0 else "FLAT"
            )

            quote = quotes_map.get(instrument.trading_symbol)
            ltp = quote.ltp if quote else None

            invested_value = Decimal(str(qty_abs)) * position.average_entry_price
            current_value = Decimal("0.00") if ltp is None else Decimal(str(qty_abs)) * ltp

            if ltp is None:
                unrealized_pnl = Decimal("0.00")
            elif position.net_quantity > 0:
                unrealized_pnl = (ltp - position.average_entry_price) * position.net_quantity
            else:
                unrealized_pnl = (position.average_entry_price - ltp) * qty_abs

            lots = 0
            if instrument.lot_size > 0:
                lots = qty_abs // instrument.lot_size

            response.append(
                PositionTerminalRead(
                    instrument_id=instrument.id,
                    trading_symbol=instrument.trading_symbol,
                    side=side,
                    lots=lots,
                    quantity=position.net_quantity,
                    average_entry_price=position.average_entry_price,
                    ltp=ltp,
                    invested_value=invested_value,
                    current_value=current_value,
                    realized_pnl=position.realized_pnl,
                    unrealized_pnl=unrealized_pnl,
                    day_pnl=unrealized_pnl,
                    product="NRML",
                    status="OPEN" if position.net_quantity != 0 else "CLOSED",
                )
            )

        return response

    @staticmethod
    def margin_for_lots(instrument: Instrument, quantity: int) -> Decimal:
        """
        Approximate short-sell margin for `quantity` units of `instrument`.

        No live SPAN/exposure margin API is available, so this uses a simplified
        stand-in: a percentage of contract notional (strike * lot size), floored
        at a minimum per lot. This intentionally over-approximates real exchange
        margin so short selling can't silently exceed account capital -- it is
        NOT a substitute for real NSE SPAN+exposure margin.
        """
        if instrument.lot_size <= 0 or quantity <= 0:
            return Decimal("0.00")
        lots = Decimal(quantity) / Decimal(instrument.lot_size)
        notional_basis = instrument.strike_price or Decimal("0.00")
        per_lot = max(
            notional_basis
            * Decimal(instrument.lot_size)
            * settings.SHORT_MARGIN_PERCENT
            / Decimal("100"),
            settings.MIN_MARGIN_PER_LOT,
        )
        return per_lot * lots

    @staticmethod
    async def compute_open_exposure(
        db: AsyncSession, account_id: uuid.UUID
    ) -> Tuple[Decimal, Decimal]:
        """
        Return (invested_value_of_open_longs, margin_used_by_open_shorts) for an
        account, used by pre-trade risk checks.
        """
        stmt = (
            select(Position, Instrument)
            .join(Instrument, Position.instrument_id == Instrument.id)
            .where(Position.account_id == account_id, Position.net_quantity != 0)
        )
        result = await db.execute(stmt)
        rows = result.all()

        invested_long = Decimal("0.00")
        margin_used = Decimal("0.00")
        for position, instrument in rows:
            qty_abs = abs(position.net_quantity)
            if position.net_quantity > 0:
                invested_long += Decimal(str(qty_abs)) * position.average_entry_price
            else:
                margin_used += AccountQueryService.margin_for_lots(instrument, qty_abs)
        return invested_long, margin_used
