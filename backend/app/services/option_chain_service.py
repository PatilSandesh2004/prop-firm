from collections import defaultdict
from datetime import date, datetime
from decimal import Decimal
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import InstrumentType, OptionType
from app.market_data.redis_cache import MarketDataCache
from app.models.instrument import Instrument
from app.market_data.upstox import upstox_provider
from app.core.config import settings


class OptionChainService:
    @staticmethod
    async def get_option_chain(
        db: AsyncSession, underlying: str, expiry: date
    ) -> dict:
        """Fetch the option chain for the current request."""
        if settings.MARKET_DATA_SOURCE == "UPSTOX" and upstox_provider.access_token:
            return await OptionChainService._get_live_option_chain(db, underlying, expiry)

        stmt = select(Instrument).where(
            Instrument.underlying == underlying,
            Instrument.instrument_type == InstrumentType.OPTION,
            Instrument.expiry_date == expiry,
        )
        result = await db.execute(stmt)
        instruments = result.scalars().all()

        strikes: dict[str, dict] = defaultdict(lambda: {"call": None, "put": None})
        spot_price = Decimal("0.00")

        fut_stmt = select(Instrument).where(
            Instrument.underlying == underlying,
            Instrument.instrument_type == InstrumentType.FUTURE,
        )
        fut_result = await db.execute(fut_stmt)
        fut = fut_result.scalars().first()
        if fut:
            fut_quote = await MarketDataCache.get_quote(fut.trading_symbol)
            if fut_quote:
                spot_price = fut_quote.ltp

        symbols = [inst.trading_symbol for inst in instruments]
        quotes_map = await MarketDataCache.get_quotes_many(symbols)

        for instrument in instruments:
            quote = quotes_map.get(instrument.trading_symbol)
            change = quote.change if quote else None
            change_pct = quote.change_pct if quote else None
            if quote and change is None and quote.prev_close:
                change = quote.ltp - quote.prev_close
                if quote.prev_close != 0:
                    change_pct = (change / quote.prev_close) * 100
            chain_item = {
                "instrument_id": str(instrument.id),
                "symbol": instrument.trading_symbol,
                "lot_size": instrument.lot_size,
                "option_type": instrument.option_type.value,
                "ltp": str(quote.ltp) if quote else None,
                "oi": quote.open_interest if quote else None,
                "change": str(change) if change is not None else None,
                "change_pct": str(change_pct) if change_pct is not None else None,
                "iv": None,
                "greeks": None,
            }

            strike_key = str(instrument.strike_price)
            if instrument.option_type == OptionType.CE:
                strikes[strike_key]["call"] = chain_item
            elif instrument.option_type == OptionType.PE:
                strikes[strike_key]["put"] = chain_item

        strike_rows = []
        for strike_value in sorted(strikes.keys(), key=lambda x: Decimal(x)):
            strike_rows.append(
                {
                    "strike": strike_value,
                    "call": strikes[strike_value]["call"],
                    "put": strikes[strike_value]["put"],
                }
            )

        return {
            "underlying": underlying,
            "expiry": expiry.isoformat(),
            "spot_price": str(spot_price),
            "strikes": strike_rows,
        }

    @staticmethod
    async def get_expiries(db: AsyncSession, underlying: str) -> list[str]:
        """Return the next three option expiries for an allowed index."""
        if settings.MARKET_DATA_SOURCE == "UPSTOX" and upstox_provider.access_token:
            return await OptionChainService._get_live_expiries(underlying)

        stmt = (
            select(Instrument.expiry_date)
            .where(
                Instrument.underlying == underlying,
                Instrument.instrument_type == InstrumentType.OPTION,
            )
            .distinct()
            .order_by(Instrument.expiry_date)
        )
        result = await db.execute(stmt)
        expiry_dates = [row[0] for row in result.all() if row[0] is not None]
        return [d.isoformat() for d in expiry_dates[:3]]

    @staticmethod
    async def _get_live_expiries(underlying: str) -> list[str]:
        """Return the next three live option expiries for an allowed index."""
        key = upstox_provider.instrument_key_for_underlying(underlying)
        if not key:
            return []
        contracts = await upstox_provider.get_option_contracts(key)
        expiries = sorted(
            {
                OptionChainService._contract_date(item.get("expiry"))
                for item in contracts
                if item.get("expiry")
            }
        )
        return [item.isoformat() for item in expiries[:3]]

    @staticmethod
    async def _get_live_option_chain(
        db: AsyncSession, underlying: str, expiry: date
    ) -> dict:
        """Build a live option matrix and persist its contracts for BUY orders."""
        underlying_key = upstox_provider.instrument_key_for_underlying(underlying)
        if not underlying_key:
            return {"underlying": underlying, "expiry": expiry.isoformat(), "spot_price": "0", "strikes": []}

        contracts = await upstox_provider.get_option_contracts(underlying_key)
        selected = {
            item["instrument_key"]: item
            for item in contracts
            if OptionChainService._contract_date(item.get("expiry")) == expiry
        }
        live_rows = await upstox_provider.get_option_chain(underlying_key, expiry)
        option_mappings = {
            option.get("instrument_key"): selected[option["instrument_key"]].get("trading_symbol", option["instrument_key"])
            for row in live_rows
            for field in ("call_options", "put_options")
            for option in [row.get(field) or {}]
            if option.get("instrument_key") in selected
        }
        await upstox_provider.register_option_symbols(option_mappings)
        strikes: dict[str, dict] = defaultdict(lambda: {"call": None, "put": None})
        spot_price = Decimal(str(live_rows[0].get("underlying_spot_price", 0))) if live_rows else Decimal("0")
        broker_keys = [
            (row.get(field) or {}).get("instrument_key")
            for row in live_rows
            for field in ("call_options", "put_options")
            if (row.get(field) or {}).get("instrument_key") in selected
        ]
        existing_result = await db.execute(
            select(Instrument).where(Instrument.broker_instrument_token.in_(broker_keys))
        )
        instruments_by_key = {
            item.broker_instrument_token: item for item in existing_result.scalars().all()
        }

        quotes_to_cache = []
        from app.schemas.market_data import DepthLevel, MarketDepth, Quote

        for row in live_rows:
            strike = str(row.get("strike_price"))
            for option_type, field in ((OptionType.CE, "call_options"), (OptionType.PE, "put_options")):
                option = row.get(field) or {}
                broker_key = option.get("instrument_key")
                contract = selected.get(broker_key)
                if not contract:
                    continue
                instrument = instruments_by_key.get(broker_key)
                if not instrument:
                    instrument = OptionChainService._build_instrument(underlying, contract)
                    db.add(instrument)
                    instruments_by_key[broker_key] = instrument
                market_data = option.get("market_data") or {}
                if market_data.get("ltp") is not None:
                    timestamp = datetime.now().astimezone()
                    ltp = Decimal(str(market_data["ltp"]))
                    bid = Decimal(str(market_data.get("bid_price", ltp)))
                    ask = Decimal(str(market_data.get("ask_price", ltp)))
                    quotes_to_cache.append(
                        Quote(
                            symbol=instrument.trading_symbol,
                            ltp=ltp,
                            bid=bid,
                            ask=ask,
                            volume=int(market_data.get("volume") or 0),
                            open_interest=int(market_data.get("oi") or 0),
                            depth=MarketDepth(
                                symbol=instrument.trading_symbol,
                                bids=[DepthLevel(price=bid, quantity=int(market_data.get("bid_qty") or 0))],
                                asks=[DepthLevel(price=ask, quantity=int(market_data.get("ask_qty") or 0))],
                                timestamp=timestamp,
                            ),
                            timestamp=timestamp,
                            source="UPSTOX_OPTION_CHAIN",
                        )
                    )
                greeks = option.get("option_greeks") or {}
                chain_item = {
                    "instrument_id": str(instrument.id),
                    "symbol": instrument.trading_symbol,
                    "lot_size": instrument.lot_size,
                    "option_type": option_type.value,
                    "ltp": str(market_data["ltp"]) if market_data.get("ltp") is not None else None,
                    "oi": market_data.get("oi"),
                    "change": str(market_data["ltp"] - market_data["close_price"])
                    if market_data.get("ltp") is not None and market_data.get("close_price") is not None
                    else None,
                    "change_pct": str(
                        ((market_data["ltp"] - market_data["close_price"]) / market_data["close_price"]) * 100
                    )
                    if market_data.get("ltp") is not None and market_data.get("close_price")
                    else None,
                    "iv": greeks.get("iv"),
                    "greeks": greeks,
                }
                strikes[strike]["call" if option_type == OptionType.CE else "put"] = chain_item

        if quotes_to_cache:
            await MarketDataCache.set_quotes_many(quotes_to_cache)

        await db.commit()

        return {
            "underlying": underlying,
            "expiry": expiry.isoformat(),
            "spot_price": str(spot_price),
            "atm_strike": min(
                (strikes.keys()),
                key=lambda value: abs(Decimal(value) - spot_price),
                default=None,
            ),
            "strikes": [
                {"strike": strike, "call": strikes[strike]["call"], "put": strikes[strike]["put"]}
                for strike in sorted(strikes, key=Decimal)
            ],
        }

    @staticmethod
    async def _cache_option_chain_quote(instrument: Instrument, market_data: dict) -> None:
        """Cache the compact option-chain market data as executable quote depth."""
        if market_data.get("ltp") is None:
            return
        from app.schemas.market_data import DepthLevel, MarketDepth, Quote
        timestamp = datetime.now().astimezone()
        ltp = Decimal(str(market_data["ltp"]))
        bid = Decimal(str(market_data.get("bid_price", ltp)))
        ask = Decimal(str(market_data.get("ask_price", ltp)))
        await MarketDataCache.set_quote(Quote(
            symbol=instrument.trading_symbol,
            ltp=ltp,
            bid=bid,
            ask=ask,
            volume=int(market_data.get("volume") or 0),
            open_interest=int(market_data.get("oi") or 0),
            depth=MarketDepth(
                symbol=instrument.trading_symbol,
                bids=[DepthLevel(price=bid, quantity=int(market_data.get("bid_qty") or 0))],
                asks=[DepthLevel(price=ask, quantity=int(market_data.get("ask_qty") or 0))],
                timestamp=timestamp,
            ),
            timestamp=timestamp,
            source="UPSTOX_OPTION_CHAIN",
        ))

    @staticmethod
    def _build_instrument(underlying: str, contract: dict) -> Instrument:
        """Build a database instrument for a live Upstox option contract."""
        broker_key = contract["instrument_key"]
        contract_expiry = OptionChainService._contract_date(contract["expiry"])
        return Instrument(
            id=uuid.uuid4(),
            exchange=contract.get("exchange", "NSE"),
            underlying=underlying,
            trading_symbol=contract.get("trading_symbol", broker_key),
            instrument_type=InstrumentType.OPTION,
            option_type=OptionType.CE if contract.get("instrument_type") == "CE" else OptionType.PE,
            expiry_date=contract_expiry,
            strike_price=Decimal(str(contract.get("strike_price", 0))),
            lot_size=int(contract.get("lot_size") or 1),
            tick_size=Decimal(str(contract.get("tick_size") or 0.05)),
            broker_instrument_token=broker_key,
        )

    @staticmethod
    def _contract_date(value) -> date:
        """Normalize an SDK expiry value to a calendar date."""
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        return date.fromisoformat(str(value)[:10])

