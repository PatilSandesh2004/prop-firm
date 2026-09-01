# 07 How to Run

Two ways to run this: **Docker** (recommended, matches `README.md`) or **manual local processes** (useful for debugging with hot-reload and direct log access).

---

## 0. Configure `.env` (both paths need this)

A `.env` file already exists at the repo root. The important keys:

```env
MARKET_DATA_SOURCE=SIMULATOR   # or UPSTOX for real live NSE index data
UPSTOX_ACCESS_TOKEN=...        # only needed if MARKET_DATA_SOURCE=UPSTOX
UPSTOX_INSTRUMENT_KEYS=...     # SYMBOL=upstox_instrument_key pairs
```

- `SIMULATOR` gives you deterministic fake ticks for the 5 index futures, and derives a moving synthetic premium for every option instrument from its underlying's simulated spot (see `09_CHANGES_2026-08-27.md`) — good enough to exercise the whole buy/sell/close/P&L flow end to end, including live-updating floating P&L. It is not real options pricing (no IV/Greeks).
- `UPSTOX` streams real index data and real option premiums, but requires a valid, unexpired Upstox access token.

---

## 1. Run with Docker (recommended)

```bash
docker compose up -d --build
docker compose exec api alembic upgrade head
```

This starts Postgres (`5433`), Redis (`6380`), the API (`http://localhost:8001`), and the frontend (`http://localhost:5173`). The `api` service now loads the root `.env` file directly (this was fixed — it previously ignored it and always ran in SIMULATOR mode).

Open **`http://localhost:5173`**.

To stop: `docker compose down` (add `-v` to also drop the Postgres/Redis volumes).

---

## 2. Run manually (backend + frontend as local processes)

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt          # or: pip install -r requirements-dev.txt
```

The app reads `.env` relative to its current working directory. The root `.env` uses a local SQLite file (`sqlite+aiosqlite:///./proptrading.db`), so run `uvicorn` **from the repo root**, not from `backend/`:

```bash
cd ..                                     # back to repo root
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001 --app-dir backend
```

(`--app-dir backend` puts `backend/` on the import path so `app.main` resolves, while the process's working directory stays at the repo root so `.env` is found there.)

(Redis is optional locally — `MarketDataCache` automatically falls back to in-memory storage if Redis isn't reachable. Postgres is only required if `DATABASE_URL` points at one; the default root `.env` uses SQLite, which needs no separate DB server.)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (default **`http://localhost:5173`**). It talks to the backend at `http://localhost:8001` (see `frontend/src/services/api.js` / `websocket.js` if you need to change the port).

---

## 3. Log in

A demo account is auto-created on first login/register:

- **Email:** `demo@propfirm.in`
- **Password:** `Demo@123`

(Configurable via `DEMO_TRADER_EMAIL` / `DEMO_TRADER_PASSWORD` in `.env`.) It's seeded with a ₹50,000 EVALUATION account and the standard NIFTY/BANKNIFTY/SENSEX/FINNIFTY/MIDCAPNIFTY futures + a NIFTY option chain.

---

## 4. Try the trading flow

1. Pick an expiry/strike in the **Option Chain & Depth** panel and click a CALL or PUT price — this opens the order ticket.
2. Use the **BUY/SELL** toggle, set lots, and submit. A BUY fills at the current ask; it creates a position immediately.
3. Watch the **Positions** tab — unrealized P&L updates live as the price ticks (no manual refresh needed).
4. Click **Close** on an open position row to flatten it at the current market price — realized P&L lands in the account summary immediately.
5. To test short-selling: open a ticket for a contract you don't hold, choose **SELL**, and submit. If the account doesn't have enough equity for the approximate margin requirement, you'll get a clear "Insufficient margin" rejection instead of a silent failure.

---

## 5. Run the backend tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/ -v
```

This covers the buy → hold → close lifecycle, short-sell margin gating, covering a short, and the fund-sufficiency check on BUY — no external services (Postgres/Redis/Upstox) required, it uses an in-memory SQLite database.

---

## Troubleshooting

- **Ticker stuck at a fixed value with no change%:** you're likely in `SIMULATOR` mode (expected — it's deterministic fake data) or the Upstox feed hasn't ticked recently. A red dot next to a ticker symbol means that quote is flagged stale.
- **"No live market data available to price this order" on BUY/SELL:** the instrument has no cached quote yet. In `SIMULATOR` mode this should now only happen in the first second or two after the backend starts (before the simulation loop's first tick); in `UPSTOX` mode, wait a moment after selecting the option chain/expiry for quotes to populate, or check the backend logs for feed connection errors.
- **"Insufficient margin to short ... units":** the account's equity is below the approximate margin requirement for that short. This is a deliberate simplification, not real exchange margin — see `06_CHANGES_AND_FIXES.md`.
- **Docker container still ignoring your Upstox credentials:** make sure you rebuilt after pulling these changes (`docker compose up -d --build`) — the fix adds `env_file: ./.env` to the `api` service in `docker-compose.yml`.
- **Frontend container crash-loops with "Cannot find native binding" / "Cannot find module './rolldown-binding...'":** stale fix — pull the latest `docker-compose.yml` and run `docker compose up -d --build frontend`. The `frontend` service used to bind-mount your host's `node_modules` straight into the Alpine (musl) container; Vite's bundler ships platform-specific native binaries, so whatever got installed on your host OS doesn't work inside the container and it never serves anything. Fixed by giving the container its own named volume for `node_modules` and having it `npm install` on startup. If you still see this after pulling, run `docker compose down -v` once to drop any old volume state, then `docker compose up -d --build` again.
