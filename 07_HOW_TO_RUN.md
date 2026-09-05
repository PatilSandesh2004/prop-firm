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

Opening `http://localhost:5173` now lands on the **marketing site** (Home, Challenges, Rules, Platform, How It Works, About, FAQ) — not the trading terminal directly. Click **TRADER ROOM** (or any "OPEN TRADING SIMULATOR" button) in the nav or on a page:

- If you're signed in, it switches straight to the terminal.
- If you're not, it opens the sign-in/register modal first.

A demo account is auto-created on first backend startup:

- **Email:** `demo@propfirm.in`
- **Password:** `Demo@123`

(Configurable via `DEMO_TRADER_EMAIL` / `DEMO_TRADER_PASSWORD` in `.env`.) It's seeded with a ₹50,000 EVALUATION account and the standard NIFTY/BANKNIFTY/SENSEX/FINNIFTY/MIDCAPNIFTY futures + a NIFTY option chain. Sign in with it, or register a brand-new account through the modal — registering creates a real `User` row and its own fresh ₹5,00,000 EVALUATION account, isolated from every other user's.

You can also skip the login screen entirely and hit `http://localhost:5173/#terminal` (or just the API directly) with no token at all — every request with no `Authorization` header still resolves to the demo user, same zero-friction behavior as before login was reintroduced. This is only a convenience for local/dev use: a request that *does* carry a bearer token is authenticated for real, and a bad/expired token is rejected (401), never silently downgraded to the demo user.

---

## 4. Try the trading flow

1. Select an underlying index (`NIFTY`, `BANKNIFTY`, `SENSEX`, `FINNIFTY`, `MIDCAPNIFTY`) and an expiry date in the **Option Chain & Depth** panel. Switching indices or expiries is instantaneous thanks to Redis/Memory batch quote caching (`get_quotes_many`).
2. Click any CALL or PUT price in the table — this opens the order ticket.
3. Review the **Funds & Margin Verification** card in the order ticket:
   - **Required Funds / Margin**: Shows exact capital required for BUY or short SELL.
   - **Available Margin**: Shows available account equity.
   - **Lot & Qty breakdown**: e.g., `1 Lot (50 Qty)`.
   - **Status Badge**: Displays `✓ Sufficient Margin` (green) or `⚠ Insufficient Funds` (red).
4. Select BUY or SELL, set the desired lot count, and submit. Orders execute immediately.
5. Watch the **Positions** tab — unrealized P&L updates tick-by-tick as market quotes arrive.
6. Click **Close** on an open position row to flatten it at current market price — realized P&L updates the account summary immediately.

---

## 5. Run the backend tests

Run the complete test suite (30 test cases):

```bash
# From repo root:
python -m pytest backend/tests/ -v
```

This covers:
- Buy → hold → close order lifecycle and P&L realization.
- Short-sell margin gating and margin-preview endpoint accuracy.
- Auth token issuance, refresh, and header validation.
- Account ownership access controls.
- Synthetic options pricing and instrument refresh.
- High-performance batch quote caching (`test_batch_cache.py`).

---

## Troubleshooting

- **Ticker change values:** Top bar tickers continuously report live gain/loss figures and percentage change (`change` and `change_pct`) relative to session reference prices.
- **Index display names:** Index futures display clean names (`NIFTY`, `BANKNIFTY`, `SENSEX`, `FINNIFTY`, `MIDCAPNIFTY`) without legacy `-FUT` / `_FUT` suffixes.
- **"No live market data available to price this order" on BUY/SELL:** The instrument has no cached quote yet. In `SIMULATOR` mode this only occurs in the first second after boot; in `UPSTOX` mode, wait a moment after selecting an option chain for live quotes to populate.
- **"Insufficient margin / funds":** The account's available margin is below the required capital for that order size. Adjust lot size or switch to an evaluation account with higher starting capital.
- **Docker container still ignoring your Upstox credentials:** Make sure you rebuilt after pulling (`docker compose up -d --build`).

