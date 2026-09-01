import logging
from typing import Dict, List, Set

from fastapi import WebSocket

from app.schemas.market_data import Quote

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        # Maps a WebSocket connection to the set of symbols it's subscribed to
        """Initialize the object and set its internal runtime state."""
        self.active_connections: Dict[WebSocket, Set[str]] = {}

    async def connect(self, websocket: WebSocket):
        """Open the provider connection and prepare the market or broker stream."""
        await websocket.accept()
        self.active_connections[websocket] = set()
        logger.info("New WebSocket connection accepted.")

    def disconnect(self, websocket: WebSocket):
        """Close the provider connection and clean up the live stream resources."""
        if websocket in self.active_connections:
            del self.active_connections[websocket]
            logger.info("WebSocket disconnected.")

    async def subscribe(self, websocket: WebSocket, symbols: List[str]):
        """Subscribe the active stream to the relevant symbol set."""
        if websocket in self.active_connections:
            self.active_connections[websocket].update(symbols)
            await websocket.send_json({"status": "subscribed", "symbols": symbols})

    async def unsubscribe(self, websocket: WebSocket, symbols: List[str]):
        """Remove the stream subscription for the given symbols."""
        if websocket in self.active_connections:
            for symbol in symbols:
                self.active_connections[websocket].discard(symbol)
            await websocket.send_json({"status": "unsubscribed", "symbols": symbols})

    async def broadcast_quote(self, quote: Quote):
        """Handle the broadcast quote workflow for the trading simulation and connect the related backend logic."""
        quote_json = quote.model_dump_json()
        disconnected_clients = []

        for websocket, subscriptions in self.active_connections.items():
            if quote.symbol in subscriptions:
                try:
                    await websocket.send_text(quote_json)
                except Exception as e:
                    logger.error(f"Failed to send to websocket: {e}")
                    disconnected_clients.append(websocket)

        for ws in disconnected_clients:
            self.disconnect(ws)

    async def broadcast_candle(self, payload: dict):
        """Broadcast a candle update to clients subscribed to its symbol."""
        symbol = payload.get("symbol")
        message = {"type": "market.candle", "payload": payload}
        disconnected_clients = []
        for websocket, subscriptions in self.active_connections.items():
            if symbol in subscriptions:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send candle to websocket: {e}")
                    disconnected_clients.append(websocket)

        for websocket in disconnected_clients:
            self.disconnect(websocket)


ws_manager = WebSocketManager()
