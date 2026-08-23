from abc import ABC, abstractmethod
from typing import Tuple

from app.models.order import Order


class ExecutionProvider(ABC):
    @abstractmethod
    async def submit_order(self, order: Order) -> Tuple[bool, str]:
        """
        Submits an order for execution.
        Returns (success: bool, message: str)
        The order object should be mutated with its updated state (e.g. FILLED, average_price)
        """
        pass

    @abstractmethod
    async def cancel_order(self, order: Order) -> Tuple[bool, str]:
        """
        Cancels an open order.
        """
        pass

    @abstractmethod
    async def modify_order(self, order: Order) -> Tuple[bool, str]:
        """
        Modifies an open order.
        """
        pass
