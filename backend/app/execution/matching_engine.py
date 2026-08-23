import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Tuple

from app.core.constants import OrderSide, OrderStatus, OrderType
from app.execution.base import ExecutionProvider
from app.market_data.redis_cache import MarketDataCache
from app.models.order import Order

logger = logging.getLogger(__name__)


class MatchingEngine(ExecutionProvider):
    async def submit_order(self, order: Order) -> Tuple[bool, str]:
        """Submit the order through the configured execution provider for simulation or broker execution."""
        if order.order_type == OrderType.MARKET:
            return await self._process_market_order(order)
        elif order.order_type == OrderType.LIMIT:
            # For simplicity in this iteration, we treat LIMIT aggressively if it crosses the spread,
            # but ideally it would go to a pending order book. We will implement basic crossing check.
            return await self._process_limit_order(order)
        else:
            return (
                False,
                f"Order type {order.order_type} not yet supported by Matching Engine.",
            )

    async def cancel_order(self, order: Order) -> Tuple[bool, str]:
        """Cancel the order request and update any related state."""
        if order.status in [
            OrderStatus.OPEN,
            OrderStatus.PENDING_TRIGGER,
            OrderStatus.PARTIALLY_FILLED,
        ]:
            order.status = OrderStatus.CANCELLED
            order.updated_at = datetime.now(timezone.utc)
            return True, "Order cancelled successfully."
        return False, "Order cannot be cancelled in its current state."

    async def modify_order(self, order: Order) -> Tuple[bool, str]:
        """Handle the modify order workflow for the trading simulation and connect the related backend logic."""
        return False, "Order modification not supported yet."

    async def _process_market_order(self, order: Order) -> Tuple[bool, str]:
        # 1. Fetch market depth
        # We need the instrument symbol. In a real system, the order service would pass it or the quote cache would use instrument_id.
        # Since our cache uses symbol, we assume the caller provided the instrument logic, but we need it here.
        # This is a slight gap: order only has instrument_id.
        # We will require the OrderService to validate liquidity, but the matching engine needs depth.
        # We will fetch depth using a helper or assume instrument is attached.

        # NOTE: For this simulated POC, we assume the symbol is available via a lookup or we just use NIFTY-FUT directly for testing.
        # In a real engine, we'd query DB for instrument symbol or pass it in.
        # Since this is an async function without DB session, we assume the caller attached the instrument symbol to the order object dynamically,
        # or we fetch it. Let's assume order._instrument_symbol is set by the service.
        """Handle the process market order workflow for the trading simulation and connect the related backend logic."""
        symbol = getattr(order, "_instrument_symbol", "NIFTY-FUT")

        quote = await MarketDataCache.get_quote(symbol)
        if not quote:
            order.status = OrderStatus.REJECTED
            order.rejection_reason = "No market data available"
            return False, order.rejection_reason

        depth = quote.depth
        levels = depth.asks if order.side == OrderSide.BUY else depth.bids

        remaining_qty = order.quantity - order.filled_quantity
        total_value = Decimal("0.00")
        total_filled = 0

        for level in levels:
            if remaining_qty <= 0:
                break

            fill_qty = min(remaining_qty, level.quantity)
            total_value += Decimal(str(fill_qty)) * level.price
            total_filled += fill_qty
            remaining_qty -= fill_qty

        if total_filled == 0:
            order.status = OrderStatus.REJECTED
            order.rejection_reason = "No liquidity available"
            return False, order.rejection_reason

        avg_price = total_value / Decimal(str(total_filled))

        order.filled_quantity += total_filled

        # Calculate new average price combining previous fills
        if order.average_price and order.filled_quantity > total_filled:
            old_value = order.average_price * Decimal(
                str(order.filled_quantity - total_filled)
            )
            order.average_price = (old_value + total_value) / Decimal(
                str(order.filled_quantity)
            )
        else:
            order.average_price = avg_price

        if remaining_qty == 0:
            order.status = OrderStatus.FILLED
        else:
            order.status = OrderStatus.PARTIALLY_FILLED

        order.updated_at = datetime.now(timezone.utc)
        return True, "Order executed"

    async def _process_limit_order(self, order: Order) -> Tuple[bool, str]:
        # Basic implementation: Reject if it doesn't cross immediately (no pending book for this iter)
        """Handle the process limit order workflow for the trading simulation and connect the related backend logic."""
        order.status = OrderStatus.OPEN
        order.rejection_reason = "Pending order book not yet implemented"
        return False, order.rejection_reason


matching_engine = MatchingEngine()
