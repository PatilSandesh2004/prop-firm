import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.logging import setup_logging
from app.core.config import settings
from app.market_data.simulator import simulator
from app.market_data.upstox import upstox_provider

# Setup logging before app initialization
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Log startup
    """Initialize the application services and seed the database before serving requests."""
    logger.info("Starting up Prop Trading Platform...")

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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router)
