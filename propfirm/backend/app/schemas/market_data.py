from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


class DepthLevel(BaseModel):
    price: Decimal
    quantity: int
    orders: Optional[int] = None


class MarketDepth(BaseModel):
    symbol: str
    bids: List[DepthLevel]
    asks: List[DepthLevel]
    timestamp: datetime


class Quote(BaseModel):
    symbol: str
    ltp: Decimal
    bid: Decimal
    ask: Decimal
    volume: int
    open_interest: int
    depth: MarketDepth
    timestamp: datetime
    source: str
    is_stale: bool = False
    open: Optional[Decimal] = None
    high: Optional[Decimal] = None
    low: Optional[Decimal] = None
    prev_close: Optional[Decimal] = None
    change: Optional[Decimal] = None
    change_pct: Optional[Decimal] = None
