# 01 Backend Audit

## Scope and Method
- Date: 2026-08-19
- Scope audited: backend, frontend integration points, migrations, tests, docker/deployment config, root documentation.
- Source-of-truth status:
	- Existing codebase: audited directly.
	- POC document: not present in repository files; assumed to be external context.
	- Locked frontend image: not present as a workspace file; requirements inferred from the prompt.

## Current Architecture (As Implemented)

### Application Entry and Lifecycle
- FastAPI entrypoint: `backend/app/main.py`.
- Lifespan behavior:
	- Auto-creates tables on startup via `Base.metadata.create_all`.
	- Seeds only two instruments if empty: `NIFTY-FUT`, `BANKNIFTY-FUT`.
	- Starts selected market data provider (`SIMULATOR` or `UPSTOX`).
- CORS currently allows wildcard `*` in addition to localhost origins.

### API Surface
- Aggregated router: `backend/app/api/router.py`.
- Registered API modules:
	- Accounts: `backend/app/api/accounts.py`
	- Instruments: `backend/app/api/instruments.py`
	- Orders: `backend/app/api/orders.py`
	- Market data WebSocket endpoint: `backend/app/api/market_data.py`
- Health endpoint includes DB and Redis checks: `/health` and `/api/v1/health`.

### Market Data Layer
- Provider abstraction exists: `backend/app/market_data/base.py`.
- Implementations:
	- Simulator: `backend/app/market_data/simulator.py`
	- Upstox feed adapter: `backend/app/market_data/upstox.py`
- Hot cache:
	- Redis-first, in-memory fallback: `backend/app/market_data/redis_cache.py`.
- WebSocket fanout:
	- Symbol subscription model only: `backend/app/market_data/websocket_manager.py`.
	- Broadcast currently supports quote messages only.

### Execution and Order Flow
- Provider abstraction exists: `backend/app/execution/base.py`.
- Factory routing by `AccountType`: `backend/app/execution/provider_factory.py`.
	- `EVALUATION` routes to matching engine.
	- `FUNDED` routes to Upstox execution provider.
- Matching engine: `backend/app/execution/matching_engine.py`
	- MARKET support: simulated fill from cached depth levels.
	- LIMIT support: currently not implemented as a pending order book; returns open/rejected-style message path.
	- SL/SL_M not implemented.
- Order service: `backend/app/services/order_service.py`
	- Validates account and instrument.
	- Runs pre-trade risk check.
	- Routes to execution provider.
	- Updates position and marks account to market on fills.

### PnL and Account State
- PnL engine: `backend/app/services/pnl_service.py`
	- Computes floating PnL from live quote LTP and open positions.
	- Updates account equity/daily PnL/drawdown.
- Account model includes realized/floating/daily fields.

### Data Models and Schema
- Core models implemented:
	- Users, Challenges, RuleVersions, Accounts.
	- Instruments, Orders, Positions.
	- Ledger entries, domain events, audit events.
- Migrations implemented for phases 2/3/5/9-10 under `backend/migrations/versions`.

### Infra and Runtime
- Docker compose includes API, frontend, Postgres, Redis.
- Python deps and tooling in `backend/pyproject.toml`.
- Alembic configured in `backend/alembic.ini` and `backend/migrations/env.py`.

## What Works (Reusable Foundation)
- Async FastAPI + SQLAlchemy async architecture.
- DB and Redis wiring.
- Provider-agnostic market data interface.
- Provider-agnostic execution interface.
- Basic order submission path with account/instrument validation.
- Position update path after fills.
- Mark-to-market floating PnL update path.
- WebSocket subscription and quote push path.
- Instrument filtering endpoint with Indian F&O relevant fields (`underlying`, `expiry_date`, `strike_price`, `option_type`).

## Incomplete / Conflicting with Current Product Scope

### Auth and Multi-User Isolation
- No authentication endpoints are wired in API router.
- No JWT issuance/refresh flow, despite JWT settings existing.
- No dependency enforcing current user/account ownership on account/order data.
- Current APIs expose account data by raw `account_id` path without authenticated scope.

### Core Trading APIs Missing for Locked Terminal
- Missing REST endpoints for:
	- Quotes snapshot by instrument/symbol.
	- OHLC candles/timeframes.
	- Option chain (structured call/put by strike/expiry).
	- Market depth endpoint.
	- Orders list/by account, order detail, cancel/modify.
	- Positions list/by account.
	- Trade history.
	- Account summary endpoint shaped for terminal.

### WebSocket Contract Insufficient
- Single generic quote stream; no topic-based channels.
- No authentication at WS connect.
- No connection status/heartbeat schema.
- No `orders.update`, `positions.update`, `account.update`, `pnl.update`, `market.option_chain`, or `market.candle` channels.

### Market Data and Instrument Coverage Gaps
- Startup seeding includes futures only, no option-chain universe.
- No ingestion/sync process for Indian F&O contract master.
- No candle aggregation service.
- No option-chain service.
- No depth endpoint abstraction beyond quote payload depth.

### Order Engine Gaps
- LIMIT lifecycle not implemented (no resting order book logic).
- SL/SL_M enums exist but not executable path in matching engine.
- Upstox execution adapter is mostly TODO simulation stubs.

### Position/PnL Output Gaps for UI
- Position schema/API for terminal fields is absent (lots, invested value, current value, day PnL, etc).
- Realized PnL handling on partial close/reversal is noted as incomplete in code comments.

### Current Scope Conflict: Evaluation Logic Present
- Risk engine currently enforces evaluation rules (`max_daily_loss`, `drawdown`, `profit_target`, pass/fail) from `RuleVersion`.
- This conflicts with requested current scope where evaluation/pass/fail logic must not be implemented now.

### Frontend-Backend Contract Mismatch (Current State)
- Frontend order API posts to `/orders` but backend expects `/accounts/{account_id}/orders/`.
- Frontend sends `instrument_symbol`; backend expects `instrument_id`.
- Frontend expects account `balance` and nested `positions`; backend `AccountRead` returns `current_balance` and no embedded positions.
- WebSocket URL used by frontend is currently valid via unprefixed router include, but API contract is not explicit.

### Test Coverage Gaps
- Only one API test exists: `tests/api/test_health.py`.
- No tests for market data, order lifecycle, positions, PnL, auth, websocket subscriptions/reconnect.

## Duplicate/Redundant/Operational Risks
- API router is included twice in app (`/api/v1` and root), duplicating endpoints; this can be intentional for compatibility but should be documented and constrained.
- `main.py` startup auto-creates DB tables while Alembic migrations are also used; dual schema management paths can drift.
- CORS wildcard with credentials is unsafe for production.
- Repo appears to include `backend/venv`; should be excluded from repository state.

## Reuse Strategy (Do Not Rewrite)
- Reuse and extend:
	- `MarketDataProvider` abstraction and existing providers.
	- `ExecutionProvider` abstraction and provider factory.
	- `OrderService` orchestration entrypoint.
	- `PnLEngine` and account MTM fields.
	- Existing instrument model and filters.
	- Existing WS manager as base for topic-aware channels.
- Avoid duplication:
	- Do not create parallel market/order/position services.
	- Evolve existing modules with backward-compatible additions.

## Missing for Production-Oriented Core Trading Phase
- AuthN/AuthZ end-to-end.
- User/account scoping in all private APIs and WS channels.
- Full terminal API set (quotes/candles/chain/depth/orders/positions/trades/account-summary).
- Topicized WS contract and efficient delta updates.
- Better order lifecycle and supported order-type validation.
- Real option-chain and candles data pipeline.
- Expanded tests and CI quality gates.

## Audit Conclusion
- The repository has a solid skeleton for provider-agnostic market data and execution.
- The current implementation is still an early simulation-first POC and is not yet aligned to the locked trading-terminal product requirements.
- Major value should come from alignment and extension of existing modules, not a full rewrite.
