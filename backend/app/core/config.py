from decimal import Decimal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"

    # Database
    DATABASE_URL: str
    ENABLE_DEMO_BOOTSTRAP: bool = True
    DEMO_TRADER_EMAIL: str = "demo@propfirm.in"
    DEMO_TRADER_PASSWORD: str = "Demo@123"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Market Data
    MARKET_DATA_SOURCE: str = "SIMULATOR"  # SIMULATOR or UPSTOX

    # Upstox Credentials
    UPSTOX_CLIENT_ID: str | None = None
    UPSTOX_CLIENT_SECRET: str | None = None
    UPSTOX_REDIRECT_URI: str | None = None
    UPSTOX_ACCESS_TOKEN: str | None = None
    UPSTOX_INSTRUMENT_KEYS: str = ""

    # Security
    JWT_SECRET_KEY: str = "supersecretkey_change_in_production"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Comma-separated list of allowed browser origins for CORS. Defaults cover
    # the local Vite dev server only -- set this explicitly in any deployed
    # environment.
    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]

    # Market Data
    MARKET_DATA_PROVIDER: str = "simulation"
    SIMULATION_TICK_INTERVAL_MS: int = 100

    # Short-sell margin approximation.
    # No live SPAN/exposure margin API is available to this platform, so short
    # margin is approximated as a percentage of contract notional (strike * lot
    # size), floored at a minimum per lot. This is intentionally conservative
    # and simplified -- it is NOT real NSE SPAN+exposure margin.
    SHORT_MARGIN_PERCENT: Decimal = Decimal("15")
    MIN_MARGIN_PER_LOT: Decimal = Decimal("30000")

    # Logging
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()
