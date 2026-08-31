# Indian F&O Prop Trading Platform

Welcome to the **Indian F&O Prop Trading Platform** backend repository! This codebase was built as a highly scalable, simulation-first Proof of Concept designed to eventually plug into real broker APIs (like Upstox or Zerodha).

This README is designed to help new developers (like you!) understand the architecture, run the system, and start contributing immediately.

---

## 🏗️ Architecture & Approach

This platform uses a modern **Python asynchronous stack** to handle high-frequency trading constraints:
- **FastAPI**: Provides incredibly fast async REST APIs and WebSocket endpoints.
- **PostgreSQL (via asyncpg/SQLAlchemy)**: Serves as our "Cold State". This immutable ledger stores user accounts, risk rules, finished orders, and audit events.
- **Redis (via redis.asyncio)**: Serves as our "Hot State". It caches live market quotes (`LTP`, `Bid`, `Ask`) and handles pub/sub events. The Matching Engine pulls quotes directly from Redis memory in microseconds rather than querying Postgres.

### The "Two-Phase" Prop Firm Model
Prop trading firms give traders virtual capital to prove their skills before handing over real money. We built this natively into the domain:
1. **Evaluation Phase (Simulated)**: An account marked `EVALUATION` is bound by strict risk rules (Max Daily Loss, Profit Target). When the trader places an order, the `ExecutionProviderFactory` automatically routes it to our internal **Matching Engine**. The Matching Engine looks at the live Redis market depth and simulates a realistic fill.
2. **Funded Phase (Real Execution)**: Once a trader passes the evaluation, the `GraduationService` creates a new `FUNDED` account. When a funded trader places an order, the exact same factory automatically routes it to the **UpstoxExecutionProvider** which hits the real NSE exchange.

**Why this approach?**
Because the `MatchingEngine` and `UpstoxExecutionProvider` both implement the exact same `ExecutionProvider` interface, the rest of the application (Order Routing, Risk Management, PnL Calculation) *has no idea* if the trade is fake or real. This means you write risk rules once, and they apply perfectly to both simulation and live trading.

---

## 📂 Project Structure

```text
prop-trading-platform/
├── backend/               # Python FastAPI Application
│   ├── app/               # Core application code
│   │   ├── api/           # REST & WebSocket endpoints
│   │   ├── execution/     # Matching Engine & Broker Adapters
│   │   ├── market_data/   # Simulators & Upstox WebSocket feed
│   │   ├── models/        # SQLAlchemy Database tables
│   │   ├── risk/          # Risk Engine (Drawdown limits)
│   │   └── services/      # Business logic (Orders, PnL, Graduation)
│   ├── migrations/        # Alembic database migrations
│   ├── scripts/           # Testing & seeding scripts
│   ├── Dockerfile         # Backend container definition
│   └── pyproject.toml     # Python dependencies
├── frontend/              # Vite React Web Application
│   ├── src/               # React components & pages
│   │   ├── components/    # Watchlist, Orders, Positions UI
│   │   └── services/      # Axios API & Native WebSocket clients
│   └── vite.config.js     # Vite configuration
├── docker-compose.yml     # Orchestrates Postgres, Redis, API, and Frontend
└── .env                   # Environment variables (Credentials)
```

---

## 🚀 Setup Instructions

Getting the codebase running locally is incredibly easy because the entire stack is containerized.

### 1. Configure the Environment
Copy the example file to create your own `.env` in the root directory:
```bash
cp .env.example .env
```
The defaults in it are enough to run locally with simulated market data --
you only need to fill in the `UPSTOX_*` values if you want live NSE/BSE
data instead. (`.env` is gitignored on purpose, since it can hold real
broker credentials -- every fresh clone starts without one.)

```env
APP_ENV=development
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/proptrading
REDIS_URL=redis://redis:6379/0

# JWT Security
JWT_SECRET_KEY=supersecretkey_change_in_production
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15

# Market Data Configuration
# Set to 'SIMULATOR' for local fake data, or 'UPSTOX' for live NSE data
MARKET_DATA_SOURCE="SIMULATOR"

# Upstox Credentials (Only needed if MARKET_DATA_SOURCE="UPSTOX")
UPSTOX_ACCESS_TOKEN="your_jwt_token_here"
```

### 2. Build and Start the Cluster
You need Docker installed. Run the following command from the root directory:
```bash
docker compose up -d --build
```
This will spin up 4 containers:
- **postgres**: The PostgreSQL database on port `5433`
- **redis**: The Redis in-memory cache on port `6380`
- **api**: The FastAPI backend on `http://localhost:8001`
- **frontend**: The React Terminal on `http://localhost:5173`

### 3. Apply Database Migrations
The database schema needs to be built inside the Postgres container. Run:
```bash
docker compose exec api alembic upgrade head
```

### 4. Open the Dashboard!
Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Further Coding / Next Steps

If you are a developer looking to extend this platform, here are some great areas to tackle next:
1. **Broker Webhooks**: In `backend/app/execution/upstox_broker.py`, the `submit_order` function currently assumes the order is immediately filled for POC purposes. You should build a webhook endpoint in `app/api/` that listens to real Upstox Order Updates (Pending -> Filled) and updates the internal `OrderStatus`.
2. **Chart Integration**: The frontend `Watchlist` pulls live data, but adding a charting library like *TradingView Lightweight Charts* to the frontend would make the terminal production-ready.
3. **Kafka Integration**: We implemented the Outbox Pattern in Postgres (`DomainEvent`). You could write a background worker that polls these events and publishes them to an external Apache Kafka cluster for analytics.
