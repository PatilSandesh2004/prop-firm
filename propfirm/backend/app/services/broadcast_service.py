import asyncio
import logging
import time
import uuid
from typing import Dict, Set

from fastapi import WebSocket
from sqlalchemy import select

from app.db.database import async_session_maker
from app.models.instrument import Instrument
from app.models.position import Position

logger = logging.getLogger(__name__)

# Minimum gap between two tick-driven pushes for the same account, so a fast
# quote feed can't flood a client (or the DB) with per-tick account queries.
_MIN_BROADCAST_INTERVAL_SECONDS = 1.0


class AccountBroadcastService:
    def __init__(self) -> None:
        """Track which websockets care about which account's live topics."""
        self._account_sockets: Dict[uuid.UUID, Set[WebSocket]] = {}
        self._socket_accounts: Dict[WebSocket, Set[uuid.UUID]] = {}
        self._last_broadcast: Dict[uuid.UUID, float] = {}
        self._lock = asyncio.Lock()

    async def subscribe(self, websocket: WebSocket, account_id: uuid.UUID) -> None:
        """Register a websocket as interested in an account's live updates."""
        async with self._lock:
            self._account_sockets.setdefault(account_id, set()).add(websocket)
            self._socket_accounts.setdefault(websocket, set()).add(account_id)

    async def unsubscribe(self, websocket: WebSocket, account_id: uuid.UUID) -> None:
        """Remove a single account subscription for a websocket."""
        async with self._lock:
            self._discard(websocket, account_id)

    async def disconnect(self, websocket: WebSocket) -> None:
        """Drop all account subscriptions held by a closed websocket."""
        async with self._lock:
            for account_id in list(self._socket_accounts.get(websocket, ())):
                self._discard(websocket, account_id)
            self._socket_accounts.pop(websocket, None)

    def _discard(self, websocket: WebSocket, account_id: uuid.UUID) -> None:
        sockets = self._account_sockets.get(account_id)
        if sockets:
            sockets.discard(websocket)
            if not sockets:
                del self._account_sockets[account_id]
        accounts = self._socket_accounts.get(websocket)
        if accounts:
            accounts.discard(account_id)

    def has_subscribers(self) -> bool:
        """Return whether any client is currently subscribed to any account topic."""
        return bool(self._account_sockets)

    async def _send_to_account(self, account_id: uuid.UUID, message: dict) -> None:
        sockets = list(self._account_sockets.get(account_id, ()))
        if not sockets:
            return
        dead = []
        for websocket in sockets:
            try:
                await websocket.send_json(message)
            except Exception as exc:
                logger.warning("Failed to push account update: %s", exc)
                dead.append(websocket)
        if dead:
            async with self._lock:
                for websocket in dead:
                    self._discard(websocket, account_id)

    async def on_order_event(self, account_id: uuid.UUID) -> None:
        """Push an immediate refresh signal after an order is placed/filled."""
        self._last_broadcast[account_id] = time.monotonic()
        for suffix in ("orders", "positions", "pnl"):
            await self._send_to_account(account_id, {"type": f"account.{account_id}.{suffix}"})

    async def on_quote_tick(self, symbol: str) -> None:
        """Look up accounts holding a position in `symbol` and push a throttled refresh."""
        if not self.has_subscribers():
            return

        try:
            async with async_session_maker() as db:
                stmt = (
                    select(Position.account_id)
                    .join(Instrument, Position.instrument_id == Instrument.id)
                    .where(Instrument.trading_symbol == symbol, Position.net_quantity != 0)
                    .distinct()
                )
                result = await db.execute(stmt)
                account_ids = [row[0] for row in result.all()]
        except Exception as exc:
            logger.error("Broadcast lookup failed for %s: %s", symbol, exc)
            return

        now = time.monotonic()
        for account_id in account_ids:
            if account_id not in self._account_sockets:
                continue
            last = self._last_broadcast.get(account_id, 0)
            if now - last < _MIN_BROADCAST_INTERVAL_SECONDS:
                continue
            self._last_broadcast[account_id] = now
            await self._send_to_account(account_id, {"type": f"account.{account_id}.pnl"})
            await self._send_to_account(account_id, {"type": f"account.{account_id}.positions"})


broadcast_service = AccountBroadcastService()
