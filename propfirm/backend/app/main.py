import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.logging import setup_logging
from app.core.config import settings
from app.db.bootstrap import ensure_seed_data
from app.db.database import async_session_maker
from app.market_data.simulator import simulator
from app.market_data.upstox import upstox_provider

# Setup logging before app initialization
setup_logging()
logger = logging.getLogger(__name__)

_INSECURE_DEFAULT_JWT_SECRET = "supersecretkey_change_in_production"

if settings.APP_ENV not in ("development", "test") and (
    settings.JWT_SECRET_KEY == _INSECURE_DEFAULT_JWT_SECRET
):
    raise RuntimeError(
        "JWT_SECRET_KEY is left at its insecure default. Set a real secret via the "
        "JWT_SECRET_KEY environment variable before running with APP_ENV="
        f"{settings.APP_ENV!r}."
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Log startup
    """Initialize the application services and seed the database before serving requests."""
    logger.info("Starting up Prop Trading Platform...")

    # Seed data once at boot, not on every login request (see app/api/auth.py history).
    async with async_session_maker() as db:
        await ensure_seed_data(db)

    # Start the market data provider based on config
    if settings.MARKET_DATA_SOURCE == "UPSTOX":
        logger.info("Initializing UPSTOX Market Data Provider")
        await upstox_provider.connect()
        symbols = upstox_provider.instrument_keys
        if symbols:
            await upstox_provider.subscribe(symbols)
            logger.info("Subscribed to %d Upstox instrument keys", len(symbols))
    else:
        logger.info("Initializing SIMULATOR Market Data Provider")
        await simulator.connect()

    yield

    # Log shutdown
    logger.info("Shutting down Prop Trading Platform...")

    # Stop simulator/provider
    if settings.MARKET_DATA_SOURCE == "UPSTOX":
        await upstox_provider.disconnect()
    else:
        await simulator.disconnect()


app = FastAPI(
    title="Prop Trading Platform",
    description="Indian F&O Prop Trading Platform - Simulation-First POC",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    # A wildcard origin combined with allow_credentials=True is rejected by
    # browsers anyway (and is a real CSRF-adjacent risk on top of that) --
    # keep this to an explicit allowlist, extendable via CORS_ALLOWED_ORIGINS.
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router)
