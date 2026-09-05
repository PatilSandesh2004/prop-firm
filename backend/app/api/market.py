from datetime import datetime, timezone

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.market_data.redis_cache import MarketDataCache
from app.schemas.market_data import MarketDepth, Quote
from app.services.candle_service import candle_service
from app.services.option_chain_service import OptionChainService

router = APIRouter(prefix="/market", tags=["Market Data"])


@router.get("/quote", response_model=Quote)
async def get_quote(symbol: str = Query(..., description="Trading symbol")):
    """Fetch the quote for the current request."""
    quote = await MarketDataCache.get_quote(symbol)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


@router.get("/quotes", response_model=list[Quote])
async def get_quotes(symbols: str = Query(..., description="Comma-separated trading symbols")):
    """Return the latest quotes for the requested market-watch symbols."""
    requested = [item.strip() for item in symbols.split(",") if item.strip()]
    if not requested:
        return []
    quotes_dict = await MarketDataCache.get_quotes_many(requested)
    return [quotes_dict[s] for s in requested if s in quotes_dict]



@router.get("/depth", response_model=MarketDepth)
async def get_depth(symbol: str = Query(..., description="Trading symbol")):
    """Fetch the depth for the current request."""
    quote = await MarketDataCache.get_quote(symbol)
    if not quote:
        raise HTTPException(status_code=404, detail="Depth not found")
    return quote.depth


@router.get("/option-chain")
async def get_option_chain(
    underlying: str = Query(...),
    expiry: date = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Return the live option-chain matrix for an allowed index and expiry."""
    if underlying not in {"NIFTY", "BANKNIFTY", "SENSEX", "FINNIFTY", "MIDCAPNIFTY"}:
        raise HTTPException(status_code=400, detail="Unsupported index")
    return await OptionChainService.get_option_chain(db, underlying, expiry)


@router.get("/candles")
async def get_candles(
    symbol: str = Query(..., description="Trading symbol"),
    timeframe: str = Query("1m", pattern="^(1m|5m|15m)$"),
    limit: int = Query(200, ge=1, le=1500),
):
    """Return the simulator's in-memory OHLC candles for the selected chart."""
    candles = candle_service.get_candles(symbol, timeframe, limit)
    if not candles:
        quote = await MarketDataCache.get_quote(symbol)
        if quote:
            candle_service.ingest_quote(quote)
            candles = candle_service.get_candles(symbol, timeframe, limit)
            if not candles:
                price = str(quote.ltp)
                candles = [
                    {
                        "t": datetime.now(timezone.utc).replace(second=0, microsecond=0).isoformat(),
                        "o": price,
                        "h": price,
                        "l": price,
                        "c": price,
                        "v": quote.volume,
                        "closed": False,
                    }
                ]
    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "candles": candles,
    }
