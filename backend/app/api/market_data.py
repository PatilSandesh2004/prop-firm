import logging
import uuid
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ValidationError

from app.market_data.websocket_manager import ws_manager
from app.services.broadcast_service import broadcast_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["Market Data (WebSocket)"])


class SubscribeMessage(BaseModel):
    action: str = "subscribe"
    symbols: List[str] = []
    subscriptions: List[dict] = []


@router.websocket("/market-data")
async def websocket_endpoint(websocket: WebSocket):
    """Handle the websocket endpoint workflow for the trading simulation and connect the related backend logic."""
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = SubscribeMessage.model_validate_json(data)
                symbols = list(message.symbols)
                for subscription in message.subscriptions:
                    topic = subscription.get("topic")
                    if topic == "market.quote":
                        symbols.extend(subscription.get("symbols", []))
                    elif subscription.get("account_id"):
                        try:
                            account_id = uuid.UUID(str(subscription["account_id"]))
                        except ValueError:
                            continue
                        if message.action == "subscribe":
                            await broadcast_service.subscribe(websocket, account_id)
                        elif message.action == "unsubscribe":
                            await broadcast_service.unsubscribe(websocket, account_id)
                if message.action == "subscribe":
                    await ws_manager.subscribe(websocket, symbols)
                elif message.action == "unsubscribe":
                    await ws_manager.unsubscribe(websocket, symbols)
            except ValidationError as e:
                await websocket.send_json(
                    {"error": "Invalid message format", "details": e.errors()}
                )
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        await broadcast_service.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)
        await broadcast_service.disconnect(websocket)
