from abc import ABC, abstractmethod
from typing import List

from app.schemas.market_data import MarketDepth, Quote


class MarketDataProvider(ABC):
    @abstractmethod
    async def connect(self) -> None:
        """Open the provider connection and prepare the market or broker stream."""
        pass

    @abstractmethod
    async def subscribe(self, symbols: List[str]) -> None:
        """Subscribe the active stream to the relevant symbol set."""
        pass

    @abstractmethod
    async def unsubscribe(self, symbols: List[str]) -> None:
        """Remove the stream subscription for the given symbols."""
        pass

    @abstractmethod
    async def get_quote(self, symbol: str) -> Quote | None:
        """Fetch the quote for the current request."""
        pass

    @abstractmethod
    async def get_depth(self, symbol: str) -> MarketDepth | None:
        """Fetch the depth for the current request."""
        pass

    @abstractmethod
    async def stream_quotes(self):
        """Handle the stream quotes workflow for the trading simulation and connect the related backend logic."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Return the API health status so the service can confirm it is running."""
        pass
