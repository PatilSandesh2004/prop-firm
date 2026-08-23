import uuid
from datetime import date
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import InstrumentType, OptionType
from app.db.database import get_db
from app.models.instrument import Instrument
from app.schemas.instrument import InstrumentRead
from app.services.option_chain_service import OptionChainService

router = APIRouter(prefix="/instruments", tags=["Instruments"])


@router.get("", response_model=List[InstrumentRead])
async def list_instruments(
    db: AsyncSession = Depends(get_db),
    underlying: Optional[str] = Query(
        None, description="Filter by underlying asset (e.g., NIFTY)"
    ),
    instrument_type: Optional[InstrumentType] = Query(
        None, description="Filter by instrument type"
    ),
    option_type: Optional[OptionType] = Query(
        None, description="Filter by option type"
    ),
    expiry_date: Optional[date] = Query(
        None, description="Filter by exact expiry date"
    ),
    strike_price: Optional[Decimal] = Query(
        None, description="Filter by exact strike price"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """List all instruments records for the active user or admin view."""
    stmt = select(Instrument)

    if underlying:
        stmt = stmt.where(Instrument.underlying == underlying)
    if instrument_type:
        stmt = stmt.where(Instrument.instrument_type == instrument_type)
    if option_type:
        stmt = stmt.where(Instrument.option_type == option_type)
    if expiry_date:
        stmt = stmt.where(Instrument.expiry_date == expiry_date)
    if strike_price:
        stmt = stmt.where(Instrument.strike_price == strike_price)

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/meta/underlyings")
async def list_option_underlyings():
    """Return the five allowed index underlyings for the option chain selector."""
    return ["NIFTY", "BANKNIFTY", "SENSEX", "FINNIFTY", "MIDCAPNIFTY"]


@router.get("/meta/expiries")
async def list_option_expiries(underlying: str = Query(...)):
    """Return the next two live option expiries for an allowed index."""
    if underlying not in {"NIFTY", "BANKNIFTY", "SENSEX", "FINNIFTY", "MIDCAPNIFTY"}:
        raise HTTPException(status_code=400, detail="Unsupported index")
    return await OptionChainService.get_live_expiries(underlying)


@router.get("/{instrument_id}", response_model=InstrumentRead)
async def get_instrument(instrument_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Fetch the instrument for the current request."""
    instrument = await db.get(Instrument, instrument_id)
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")
    return instrument
