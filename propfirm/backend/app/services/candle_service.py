from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal

from app.schemas.market_data import Quote


class CandleService:
    def __init__(self):
        """Initialize the object and set its internal runtime state."""
        self._candles_1m: dict[str, dict[datetime, dict]] = defaultdict(dict)

    def ingest_quote(self, quote: Quote) -> dict:
        """Handle the ingest quote workflow for the trading simulation and connect the related backend logic."""
        ts = quote.timestamp.astimezone(timezone.utc)
        bucket = ts.replace(second=0, microsecond=0)

        symbol_buckets = self._candles_1m[quote.symbol]
        candle = symbol_buckets.get(bucket)
        if candle is None:
            candle = {
                "t": bucket,
                "o": quote.ltp,
                "h": quote.ltp,
                "l": quote.ltp,
                "c": quote.ltp,
                "v": quote.volume,
                "closed": False,
            }
            symbol_buckets[bucket] = candle
        else:
            candle["h"] = max(candle["h"], quote.ltp)
            candle["l"] = min(candle["l"], quote.ltp)
            candle["c"] = quote.ltp
            candle["v"] = max(candle["v"], quote.volume)

        # mark older candles closed
        for key, item in symbol_buckets.items():
            if key != bucket:
                item["closed"] = True

        # Keep bounded history
        if len(symbol_buckets) > 1500:
            for old_key in sorted(symbol_buckets.keys())[:-1500]:
                del symbol_buckets[old_key]

        return {
            "symbol": quote.symbol,
            "timeframe": "1m",
            "candle": {
                "t": candle["t"].isoformat(),
                "o": str(candle["o"]),
                "h": str(candle["h"]),
                "l": str(candle["l"]),
                "c": str(candle["c"]),
                "v": candle["v"],
                "closed": candle["closed"],
            },
        }

    def get_candles(self, symbol: str, timeframe: str = "1m", limit: int = 200) -> list[dict]:
        """Fetch the candles for the current request."""
        if timeframe not in {"1m", "5m", "15m"}:
            timeframe = "1m"

        base = self._candles_1m.get(symbol, {})
        ordered = [base[k] for k in sorted(base.keys())]

        if timeframe == "1m":
            return [
                {
                    "t": c["t"].isoformat(),
                    "o": str(c["o"]),
                    "h": str(c["h"]),
                    "l": str(c["l"]),
                    "c": str(c["c"]),
                    "v": c["v"],
                    "closed": c["closed"],
                }
                for c in ordered[-limit:]
            ]

        group_size = 5 if timeframe == "5m" else 15
        aggregated: list[dict] = []
        for i in range(0, len(ordered), group_size):
            chunk = ordered[i : i + group_size]
            if not chunk:
                continue
            aggregated.append(
                {
                    "t": chunk[0]["t"].isoformat(),
                    "o": str(chunk[0]["o"]),
                    "h": str(max(x["h"] for x in chunk)),
                    "l": str(min(x["l"] for x in chunk)),
                    "c": str(chunk[-1]["c"]),
                    "v": max(x["v"] for x in chunk),
                    "closed": bool(chunk[-1]["closed"]),
                }
            )
        return aggregated[-limit:]


candle_service = CandleService()
