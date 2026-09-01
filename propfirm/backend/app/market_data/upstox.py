import asyncio
import logging
import time
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional

import upstox_client
from app.core.config import settings
from app.market_data.base import MarketDataProvider
from app.market_data.redis_cache import MarketDataCache
from app.market_data.websocket_manager import ws_manager
from app.schemas.market_data import DepthLevel, MarketDepth, Quote
from app.services.broadcast_service import broadcast_service
from app.services.candle_service import candle_service

logger = logging.getLogger(__name__)

STALE_AFTER_SECONDS = 5.0


class UpstoxMarketDataProvider(MarketDataProvider):
    def __init__(self):
        """Initialize the object and set its internal runtime state."""
        self.is_running = False
        self.access_token = settings.UPSTOX_ACCESS_TOKEN
        self.streamer = None
        self.loop = None
        self._connect_future = None
        self._poll_task: Optional[asyncio.Task] = None
        self._socket_open = False
        self._pending_symbols: list[str] = []
        self.instrument_key_to_symbol: dict[str, str] = {}
        self.instrument_keys: list[str] = []
        self.prev_close: dict[str, Decimal] = {}
        self._last_tick_at: dict[str, float] = {}
        for item in settings.UPSTOX_INSTRUMENT_KEYS.split(","):
            item = item.strip()
            if not item:
                continue
            if "=" in item:
                symbol, instrument_key = item.split("=", 1)
                self.instrument_key_to_symbol[instrument_key.strip()] = symbol.strip()
                self.instrument_keys.append(instrument_key.strip())
            else:
                self.instrument_key_to_symbol[item] = item
                self.instrument_keys.append(item)
        
        if self.access_token:
            configuration = upstox_client.Configuration()
            configuration.access_token = self.access_token
            # Initialize without symbols initially
            self.streamer = upstox_client.MarketDataStreamerV3(
                upstox_client.ApiClient(configuration), 
                [], 
                "full"
            )
            self.streamer.on("message", self._on_message_sync)
            self.streamer.on("open", self._on_open)
            self.streamer.on("close", self._on_close)
            self.streamer.on("error", self._on_error)

    def _on_open(self):
        """Handle the on open workflow for the trading simulation and connect the related backend logic."""
        self._socket_open = True
        logger.info("Upstox V3 WebSocket is OPEN.")
        if self._pending_symbols:
            symbols = list(dict.fromkeys(self._pending_symbols))
            self._pending_symbols.clear()
            try:
                self.streamer.subscribe(symbols, "full")
                logger.info("Subscribed to queued Upstox symbols: %s", symbols)
            except Exception as exc:
                logger.error("Upstox subscription failed after connect: %s", exc)

    def _on_close(self, code=None, reason=None):
        """Handle the on close workflow for the trading simulation and connect the related backend logic."""
        self._socket_open = False
        logger.warning(f"Upstox V3 WebSocket is CLOSED. Code: {code}, Reason: {reason}")

    def _on_error(self, error):
        """Handle the on error workflow for the trading simulation and connect the related backend logic."""
        logger.error(f"Upstox V3 WebSocket ERROR: {error}")

    async def connect(self) -> None:
        """Open the provider connection and prepare the market or broker stream."""
        if not self.access_token or not self.streamer:
            logger.warning("Upstox access token missing. Upstox Feed will not start.")
            return

        if not self.is_running:
            self.is_running = True
            logger.info("Connecting to Upstox V3 Market Data Feed...")
            
            self.loop = asyncio.get_running_loop()
            # The SDK keeps the WebSocket alive inside connect(), so do not block
            # FastAPI startup while its worker thread owns that connection.
            self._connect_future = self.loop.run_in_executor(None, self.streamer.connect)
            self._connect_future.add_done_callback(self._connect_finished)
            self._poll_task = asyncio.create_task(self._poll_ltp_fallback())
            asyncio.create_task(self._prime_prev_close())

    def _connect_finished(self, future):
        """Log the result of the background Upstox connection attempt."""
        try:
            future.result()
        except Exception as exc:
            self.is_running = False
            logger.error("Upstox connection failed: %s", exc)

    async def disconnect(self) -> None:
        """Close the provider connection and clean up the live stream resources."""
        self.is_running = False
        self._socket_open = False
        if self._poll_task:
            self._poll_task.cancel()
            try:
                await self._poll_task
            except asyncio.CancelledError:
                pass
        if self.streamer and hasattr(self.streamer, "disconnect"):
            try:
                self.streamer.disconnect()
            except Exception as exc:
                logger.warning("Upstox disconnect warning: %s", exc)
        logger.info("Disconnected from Upstox Feed.")

    async def subscribe(self, symbols: List[str]) -> None:
        """Subscribe the active stream to the relevant symbol set."""
        logger.info(f"Subscribing to Upstox symbols: {symbols}")
        if self.streamer and self.is_running:
            if not self._socket_open:
                self._pending_symbols.extend(symbols)
                logger.info("Queued Upstox subscription until WebSocket opens")
                return
            self.streamer.subscribe(symbols, "full")

    async def register_option_symbols(self, mappings: dict[str, str]) -> None:
        """Register live option broker keys and subscribe them to tick updates."""
        new_symbols = []
        for instrument_key, trading_symbol in mappings.items():
            if self.instrument_key_to_symbol.get(instrument_key) != trading_symbol:
                self.instrument_key_to_symbol[instrument_key] = trading_symbol
            if instrument_key not in self.instrument_key_to_symbol:
                new_symbols.append(instrument_key)
            elif instrument_key not in self.instrument_keys and instrument_key not in new_symbols:
                new_symbols.append(instrument_key)
        if new_symbols:
            await self.subscribe(new_symbols)

    async def unsubscribe(self, symbols: List[str]) -> None:
        """Remove the stream subscription for the given symbols."""
        logger.info(f"Unsubscribing from Upstox symbols: {symbols}")
        if self.streamer and self.is_running:
            self.streamer.unsubscribe(symbols)

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
        """Handle the stream quotes workflow for the trading simulation and connect the related backend logic."""
        raise NotImplementedError("Use websocket manager directly for streaming.")

    async def health_check(self) -> bool:
        """Return the API health status so the service can confirm it is running."""
        return self.is_running

    def instrument_key_for_underlying(self, underlying: str) -> str | None:
        """Return the configured Upstox underlying key for a platform index name."""
        symbol = {
            "NIFTY": "NIFTY-FUT",
            "BANKNIFTY": "BANKNIFTY-FUT",
            "SENSEX": "SENSEX-FUT",
            "FINNIFTY": "FINNIFTY-FUT",
            "MIDCAPNIFTY": "MIDCAPNIFTY-FUT",
        }.get(underlying, underlying)
        for key, mapped_symbol in self.instrument_key_to_symbol.items():
            if mapped_symbol == symbol:
                return key
        return None

    async def get_option_contracts(self, underlying_key: str) -> list[dict]:
        """Fetch live option contracts for an Upstox index underlying."""
        configuration = upstox_client.Configuration()
        configuration.access_token = self.access_token
        api = upstox_client.OptionsApi(upstox_client.ApiClient(configuration))
        # Uses the currently running loop, not self.loop -- this (and the
        # other REST helpers below) can be called from a request handler
        # before/without connect() ever running (e.g. connect() failed, or
        # MARKET_DATA_SOURCE flips modes at request time), and self.loop is
        # only ever set inside connect(). self.loop is still what backs the
        # WebSocket callback bridge in _on_message_sync, which does need the
        # specific app loop from connect() -- that usage is unaffected.
        response = await asyncio.get_running_loop().run_in_executor(
            None, lambda: api.get_option_contracts(underlying_key)
        )
        payload = response.to_dict() if hasattr(response, "to_dict") else response
        return payload.get("data", []) if isinstance(payload, dict) else []

    async def get_option_chain(self, underlying_key: str, expiry: date) -> list[dict]:
        """Fetch the complete live CE/PE strike matrix for an expiry."""
        configuration = upstox_client.Configuration()
        configuration.access_token = self.access_token
        api = upstox_client.OptionsApi(upstox_client.ApiClient(configuration))
        response = await asyncio.get_running_loop().run_in_executor(
            None,
            lambda: api.get_put_call_option_chain(underlying_key, expiry.isoformat()),
        )
        payload = response.to_dict() if hasattr(response, "to_dict") else response
        return payload.get("data", []) if isinstance(payload, dict) else []

    async def get_option_quotes(self, instrument_keys: list[str]) -> dict[str, dict]:
        """Fetch live option prices and depth for the requested broker keys."""
        if not instrument_keys:
            return {}
        configuration = upstox_client.Configuration()
        configuration.access_token = self.access_token
        api = upstox_client.MarketQuoteApi(upstox_client.ApiClient(configuration))
        response = await asyncio.get_running_loop().run_in_executor(
            None,
            lambda: api.get_full_market_quote(",".join(instrument_keys), "2.0"),
        )
        payload = response.to_dict() if hasattr(response, "to_dict") else response
        data = payload.get("data", {}) if isinstance(payload, dict) else {}
        return {
            item.get("instrument_token", key): item
            for key, item in data.items()
            if isinstance(item, dict)
        }

    async def _poll_ltp_fallback(self):
        """Poll Upstox LTP snapshots when the WebSocket has not delivered a feed."""
        configuration = upstox_client.Configuration()
        configuration.access_token = self.access_token
        api = upstox_client.MarketQuoteApi(upstox_client.ApiClient(configuration))
        while self.is_running and self.instrument_keys:
            try:
                for requested_key in self.instrument_keys:
                    symbol = self.instrument_key_to_symbol.get(requested_key, requested_key)
                    try:
                        response = await self.loop.run_in_executor(
                            None,
                            lambda key=requested_key: api.ltp(key, "2.0"),
                        )
                        payload = response.to_dict() if hasattr(response, "to_dict") else response
                        data = payload.get("data", {}) if isinstance(payload, dict) else {}
                        for instrument_key, item in data.items():
                            ltp_value = item.get("last_price", item.get("ltp")) if isinstance(item, dict) else None
                            if ltp_value is None:
                                continue
                            actual_key = item.get("instrument_token", instrument_key)
                            quote = self._quote_from_ltp(actual_key, Decimal(str(ltp_value)))
                            await self._handle_quote_update(quote)
                    except Exception as exc:
                        # One symbol failing (rate limit, transient network error) must
                        # not block the rest of the watchlist from refreshing.
                        logger.warning("Upstox LTP fallback failed for %s: %s", symbol, exc)
                        await self._mark_stale_if_overdue(symbol)
            except asyncio.CancelledError:
                break
            await asyncio.sleep(2)

    async def _mark_stale_if_overdue(self, symbol: str) -> None:
        """Flag the cached quote stale once it hasn't ticked in STALE_AFTER_SECONDS."""
        last = self._last_tick_at.get(symbol)
        if last is not None and (time.monotonic() - last) < STALE_AFTER_SECONDS:
            return
        quote = await MarketDataCache.get_quote(symbol)
        if quote and not quote.is_stale:
            stale_quote = quote.model_copy(update={"is_stale": True})
            await MarketDataCache.set_quote(stale_quote)
            await ws_manager.broadcast_quote(stale_quote)

    async def _prime_prev_close(self) -> None:
        """Best-effort fetch of previous close so change/change% can be shown immediately."""
        if not self.instrument_keys:
            return
        try:
            configuration = upstox_client.Configuration()
            configuration.access_token = self.access_token
            api = upstox_client.MarketQuoteApi(upstox_client.ApiClient(configuration))
            response = await self.loop.run_in_executor(
                None,
                lambda: api.get_full_market_quote(",".join(self.instrument_keys), "2.0"),
            )
            payload = response.to_dict() if hasattr(response, "to_dict") else response
            data = payload.get("data", {}) if isinstance(payload, dict) else {}
            for instrument_key, item in data.items():
                if not isinstance(item, dict):
                    continue
                actual_key = item.get("instrument_token", instrument_key)
                close = (item.get("ohlc") or {}).get("close")
                if close is None:
                    continue
                symbol = self.instrument_key_to_symbol.get(actual_key, actual_key)
                self.prev_close[symbol] = Decimal(str(close))
        except Exception as exc:
            logger.warning("Could not prime previous-close reference prices: %s", exc)

    def _quote_from_ltp(self, instrument_key: str, ltp: Decimal) -> Quote:
        """Build a tradeable quote from an Upstox LTP snapshot."""
        symbol = self.instrument_key_to_symbol.get(instrument_key, instrument_key)
        depth = MarketDepth(
            symbol=symbol,
            bids=[DepthLevel(price=ltp, quantity=100000)],
            asks=[DepthLevel(price=ltp, quantity=100000)],
            timestamp=datetime.now(timezone.utc),
        )
        prev_close = self.prev_close.get(symbol)
        change = (ltp - prev_close) if prev_close else None
        change_pct = (change / prev_close * 100) if prev_close and change is not None else None
        return Quote(
            symbol=symbol,
            ltp=ltp,
            bid=ltp,
            ask=ltp,
            volume=0,
            open_interest=0,
            depth=depth,
            timestamp=datetime.now(timezone.utc),
            source="UPSTOX_REST",
            prev_close=prev_close,
            change=change,
            change_pct=change_pct,
        )

    def _parse_upstox_messages(self, message: dict) -> list[Quote]:
        """Translate a decoded Upstox FeedResponse into platform quote objects."""
        quotes = []
        for instrument_key, feed in message.get("feeds", {}).items():
            full_feed_container = feed.get("fullFeed", {})
            # Index instruments (spot NIFTY/BANKNIFTY/SENSEX/...) report under
            # `indexFF`, not `marketFF` -- without this fallback every index
            # tick from the live WebSocket is silently dropped below.
            full_feed = full_feed_container.get("marketFF") or full_feed_container.get("indexFF") or {}
            ltpc = full_feed.get("ltpc") or feed.get("ltpc", {})
            ltp = Decimal(str(ltpc.get("ltp", 0)))
            if ltp <= 0:
                continue

            symbol = self.instrument_key_to_symbol.get(instrument_key, instrument_key)

            day_open = day_high = day_low = None
            prev_close = self.prev_close.get(symbol)
            for entry in (full_feed.get("marketOHLC") or {}).get("ohlc", []):
                if not isinstance(entry, dict):
                    continue
                interval = str(entry.get("interval", "")).lower()
                if interval and interval not in ("1d", "i1", "day"):
                    continue
                day_open = Decimal(str(entry["open"])) if entry.get("open") is not None else day_open
                day_high = Decimal(str(entry["high"])) if entry.get("high") is not None else day_high
                day_low = Decimal(str(entry["low"])) if entry.get("low") is not None else day_low
                if entry.get("close") is not None:
                    prev_close = Decimal(str(entry["close"]))
                break
            if prev_close is not None:
                self.prev_close[symbol] = prev_close
            change = (ltp - prev_close) if prev_close else None
            change_pct = (change / prev_close * 100) if prev_close and change is not None else None

            level_data = full_feed.get("marketLevel", {}).get("bidAskQuote", [])
            depth_data = {
                "bids": [
                    {"price": level.get("bidP", 0), "quantity": level.get("bidQ", 0)}
                    for level in level_data
                    if level.get("bidP") is not None
                ],
                "asks": [
                    {"price": level.get("askP", 0), "quantity": level.get("askQ", 0)}
                    for level in level_data
                    if level.get("askP") is not None
                ],
            }
            bids = [
                DepthLevel(price=Decimal(str(item["price"])), quantity=int(item["quantity"]))
                for item in depth_data["bids"]
            ]
            asks = [
                DepthLevel(price=Decimal(str(item["price"])), quantity=int(item["quantity"]))
                for item in depth_data["asks"]
            ]
            if not bids:
                bids = [DepthLevel(price=ltp, quantity=0)]
            if not asks:
                asks = [DepthLevel(price=ltp, quantity=0)]

            depth = MarketDepth(
                symbol=symbol, bids=bids, asks=asks, timestamp=datetime.now(timezone.utc)
            )
            quotes.append(
                Quote(
                    symbol=symbol,
                    ltp=ltp,
                    bid=bids[0].price,
                    ask=asks[0].price,
                    volume=int(full_feed.get("vtt", 0)),
                    open_interest=int(full_feed.get("oi", 0)),
                    depth=depth,
                    timestamp=datetime.now(timezone.utc),
                    source="UPSTOX",
                    open=day_open,
                    high=day_high,
                    low=day_low,
                    prev_close=prev_close,
                    change=change,
                    change_pct=change_pct,
                )
            )
        return quotes

    def _parse_upstox_message(self, message: dict) -> Quote:
        """Translate the first quote in a decoded Upstox FeedResponse."""
        quotes = self._parse_upstox_messages(message)
        if not quotes:
            raise ValueError("Upstox message contained no usable quote")
        return quotes[0]

    def _legacy_parse_upstox_message(self, message: dict) -> Quote:
        """Parse the legacy flat payload shape used by older Upstox SDK versions."""
        symbol = message.get("instrument_token", "UNKNOWN")
        ltp = Decimal(str(message.get("ltp", 0)))
        depth_data = message.get("depth", {})
        bids = [
            DepthLevel(
                price=Decimal(str(b["price"])),
                quantity=b["quantity"],
                orders=b.get("orders", 1),
            )
            for b in depth_data.get("bids", [])
        ]
        asks = [
            DepthLevel(
                price=Decimal(str(a["price"])),
                quantity=a["quantity"],
                orders=a.get("orders", 1),
            )
            for a in depth_data.get("asks", [])
        ]

        depth = MarketDepth(
            symbol=symbol, bids=bids, asks=asks, timestamp=datetime.now(timezone.utc)
        )

        return Quote(
            symbol=symbol,
            ltp=ltp,
            bid=bids[0].price if bids else ltp,
            ask=asks[0].price if asks else ltp,
            volume=message.get("volume", 0),
            open_interest=message.get("oi", 0),
            depth=depth,
            timestamp=datetime.now(timezone.utc),
            source="UPSTOX",
        )

    def _on_message_sync(self, message):
        """Handle the on message sync workflow for the trading simulation and connect the related backend logic."""
        try:
            # Safely schedule the async coroutine from the background thread
            if self.loop and self.loop.is_running():
                for quote in self._parse_upstox_messages(message):
                    asyncio.run_coroutine_threadsafe(self._handle_quote_update(quote), self.loop)
            else:
                logger.error("Event loop is not running. Cannot process Upstox message.")
                
        except Exception as e:
            logger.error(f"Failed to parse Upstox message: {e}")

    async def _handle_quote_update(self, quote: Quote):
        """Cache and fan out a fresh quote, and mark its symbol as freshly ticked."""
        self._last_tick_at[quote.symbol] = time.monotonic()
        await MarketDataCache.set_quote(quote)
        await ws_manager.broadcast_quote(quote)
        candle = candle_service.ingest_quote(quote)
        await ws_manager.broadcast_candle(candle)
        await broadcast_service.on_quote_tick(quote.symbol)


upstox_provider = UpstoxMarketDataProvider()
