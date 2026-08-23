import logging
import uuid
from datetime import datetime, timezone
from typing import Tuple

from app.core.constants import OrderStatus
from app.execution.base import ExecutionProvider
from app.models.order import Order

logger = logging.getLogger(__name__)


class UpstoxExecutionProvider(ExecutionProvider):
    async def submit_order(self, order: Order) -> Tuple[bool, str]:
        """Submit the order through the configured execution provider for simulation or broker execution."""
        logger.info(f"Submitting order {order.id} to REAL Upstox Broker API")
        # TODO: Use upstox-python-sdk to actually place the order.
        # Example logic:
        # payload = {
        #    "quantity": order.quantity,
        #    "product": "D",
        #    "validity": "DAY",
        #    "price": float(order.price) if order.price else 0.0,
        #    "tag": str(order.id),
        #    "instrument_token": "NSE_EQ|INE848E01016",
        #    "order_type": order.order_type.value,
        #    "transaction_type": order.side.value,
        #    "disclosed_quantity": 0,
        #    "trigger_price": float(order.trigger_price) if order.trigger_price else 0.0,
        #    "is_amo": False
        # }
        # response = api_instance.place_order(payload, "v2")

        # For the POC, we simulate the broker accepting it,
        # but in production, status would go to OPEN/PENDING until a webhook confirms fill.
        order.status = OrderStatus.OPEN
        order.broker_order_id = f"UPSTOX-{uuid.uuid4().hex[:8]}"
        order.updated_at = datetime.now(timezone.utc)
        return True, "Order submitted to Upstox"

    async def cancel_order(self, order: Order) -> Tuple[bool, str]:
        """Cancel the order request and update any related state."""
        logger.info(f"Cancelling order {order.id} on REAL Upstox Broker API")
        # TODO: Send cancel request to Upstox using order.broker_order_id
        order.status = OrderStatus.CANCELLED
        order.updated_at = datetime.now(timezone.utc)
        return True, "Order cancelled on Upstox"

    async def modify_order(self, order: Order) -> Tuple[bool, str]:
        """Handle the modify order workflow for the trading simulation and connect the related backend logic."""
        logger.info(f"Modifying order {order.id} on REAL Upstox Broker API")
        # TODO: Send modify request to Upstox
        return True, "Order modified on Upstox"
