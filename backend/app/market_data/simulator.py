import asyncio
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from app.market_data.base import MarketDataProvider
from app.market_data.redis_cache import MarketDataCache
from app.market_data.websocket_manager import ws_manager
from app.schemas.market_data import DepthLevel, MarketDepth, Quote
from app.services.broadcast_service import broadcast_service
from app.services.candle_service import candle_service

logger = logging.getLogger(__name__)


class SimulatedMarketDataProvider(MarketDataProvider):
    def __init__(self):
        """Initialize the object and set its internal runtime state."""
        self.is_running = False
        self.task: Optional[asyncio.Task] = None
        # Base state for some dummy instruments
        self.market_state = {
            "NIFTY-FUT": Decimal("25000.00"),
            "BANKNIFTY-FUT": Decimal("52000.00"),
            "SENSEX-FUT": Decimal("82000.00"),
            "FINNIFTY-FUT": Decimal("23500.00"),
            "MIDCAPNIFTY-FUT": Decimal("12500.00"),
        }
        self.prev_close = dict(self.market_state)
        self.day_open = dict(self.market_state)
        self.day_high = dict(self.market_state)
        self.day_low = dict(self.market_state)

    async def connect(self) -> None:
        """Open the provider connection and prepare the market or broker stream."""
        if not self.is_running:
            self.is_running = True
            self.task = asyncio.create_task(self._simulation_loop())
            logger.info("Simulated Market Data Provider started.")

    async def disconnect(self) -> None:
        """Close the provider connection and clean up the live stream resources."""
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Simulated Market Data Provider stopped.")

    async def subscribe(self, symbols: List[str]) -> None:
        """Subscribe the active stream to the relevant symbol set."""
        pass  # Simulator generates for all known symbols anyway

    async def unsubscribe(self, symbols: List[str]) -> None:
        """Remove the stream subscription for the given symbols."""
        pass

    async def get_quote(self, symbol: str) -> Quote | None:
        """Fetch the quote for the current request."""
        return await MarketDataCache.get_quote(symbol)

    async def get_depth(self, symbol: str) -> MarketDepth | None:
        """Fetch the depth for the current request."""
        quote = await self.get_quote(symbol)
        if quote:
            return quote.depth
        return None

    async def stream_quotes(self):
        # In a real environment, this might listen to a Redis PubSub channel.
        # For the simulator, it's easier to just broadcast via the WS manager.
        """Handle the stream quotes workflow for the trading simulation and connect the related backend logic."""
        raise NotImplementedError("Use websocket manager directly for streaming.")

    async def health_check(self) -> bool:
        """Return the API health status so the service can confirm it is running."""
        return self.is_running

    def _generate_depth(self, ltp: Decimal, symbol: str) -> MarketDepth:
        # Generate 5 levels of deterministic dummy depth around LTP
        """Handle the generate depth workflow for the trading simulation and connect the related backend logic."""
        bids = []
        asks = []
        for i in range(1, 6):
            bid_price = ltp - Decimal(str(i))
            ask_price = ltp + Decimal(str(i))
            bids.append(DepthLevel(price=bid_price, quantity=100 * i, orders=i))
            asks.append(DepthLevel(price=ask_price, quantity=100 * i, orders=i))

        return MarketDepth(
            symbol=symbol, bids=bids, asks=asks, timestamp=datetime.now(timezone.utc)
        )

    async def _simulation_loop(self):
        """Handle the simulation loop workflow for the trading simulation and connect the related backend logic."""
        tick_count = 0
        while self.is_running:
            try:
                for symbol, price in self.market_state.items():
                    # Deterministic oscillation
                    change = (
                        Decimal("1.00") if tick_count % 2 == 0 else Decimal("-1.00")
                    )
                    if tick_count % 5 == 0:
                        change *= Decimal("2.00")

                    new_ltp = price + change
                    self.market_state[symbol] = new_ltp
                    self.day_high[symbol] = max(self.day_high[symbol], new_ltp)
                    self.day_low[symbol] = min(self.day_low[symbol], new_ltp)

                    depth = self._generate_depth(new_ltp, symbol)

                    prev_close = self.prev_close[symbol]
                    day_change = new_ltp - prev_close
                    day_change_pct = (
                        (day_change / prev_close) * 100 if prev_close else None
                    )

                    quote = Quote(
                        symbol=symbol,
                        ltp=new_ltp,
                        bid=depth.bids[0].price,
                        ask=depth.asks[0].price,
                        volume=1000 + (tick_count * 10),
                        open_interest=50000,
                        depth=depth,
                        timestamp=datetime.now(timezone.utc),
                        source="SIMULATOR",
                        open=self.day_open[symbol],
                        high=self.day_high[symbol],
                        low=self.day_low[symbol],
                        prev_close=prev_close,
                        change=day_change,
                        change_pct=day_change_pct,
                    )

                    # Update Redis
                    await MarketDataCache.set_quote(quote)

                    # Broadcast to WS clients
                    await ws_manager.broadcast_quote(quote)
                    candle = candle_service.ingest_quote(quote)
                    await ws_manager.broadcast_candle(candle)
                    await broadcast_service.on_quote_tick(symbol)

                tick_count += 1
                await asyncio.sleep(1.0)  # 1 tick per second
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in simulation loop: {e}")
                await asyncio.sleep(1.0)


# Global singleton
simulator = SimulatedMarketDataProvider()
