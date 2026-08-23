# 02 Frontend Backend Gap Analysis

## Scope
This document maps the locked trading-terminal frontend requirements to currently available backend capabilities, identifies missing functionality, and defines required changes without duplicating existing services.

## Mapping Matrix

| Frontend Component | Required Data | Existing Backend Component | Existing API/WS | Gap | Required Change |
|---|---|---|---|---|---|
| Top Bar Indices Ticker (NIFTY, BANKNIFTY, SENSEX) | Symbol, LTP, change, change_pct, status timestamp | Market providers + cache exist | WS quote stream supports symbol subscription | No REST snapshot for top bar, no canonical index list, no change/change_pct fields in Quote schema | Add quote snapshot endpoint, enrich quote model with prev_close/open/high/low/change/change_pct; define index symbol config |
| Left Sidebar Navigation | UI-only state plus auth context/account info | Accounts endpoint exists | `GET /accounts` | No auth context, raw list without user scoping | Add auth and account-scoped endpoint (`/me/accounts`) |
| Main Chart Panel | Historical candles + live candle updates | Market provider exists; no candle service | None | No candle REST, no candle WS channel | Add candle service with REST bootstrap and WS incremental updates |
| Call Panel | Selected option contract quote, OHLC, volume, lot size, funds info | Instrument model and quote cache exist | `GET /instruments`; WS quotes | No option selector contract endpoint, no funds summary endpoint, quote lacks OHLC | Add option contract lookup endpoints + account summary endpoint; enrich quote fields |
| Put Panel | Same as call panel | Same | Same | Same | Same |
| Right Option Chain | Underlying, expiry, strikes, call/put LTP/OI/change/IV/greeks where available | Instrument model has expiry/strike/option_type; provider has quote/depth | `GET /instruments` only | No structured option-chain service or API; no chain WS updates | Add option-chain service + REST endpoint + WS topic; expose available greeks/IV only when present |
| Right Market Depth | Bid/ask levels and quantities | Quote embeds `depth` | WS quote payload includes depth | No dedicated depth API; no depth topic separation | Add `market.depth` topic and optional depth REST endpoint |
| Order Entry | account_id, instrument_id, side, order_type, quantity/lots, price/trigger validations | `OrderService`, matching engine, execution factory | `POST /accounts/{account_id}/orders/` | Frontend API currently wrong path/payload; no order type capability endpoint | Fix frontend payloads; add order capability metadata endpoint; add lot to quantity helper contract |
| Orders Tab | Order list, status lifecycle updates | Order model exists | Only order placement endpoint | No list/detail/cancel/modify endpoints; no WS order updates | Add orders query and mutation endpoints + `orders.update` WS topic |
| Positions Tab | Instrument, side, qty/lots, avg entry, LTP, invested/current value, realized/unrealized/day pnl | Position model + PnL engine exist | No positions API | Missing aggregation endpoint and live updates | Add positions read endpoint and `positions.update` topic; include computed display fields server-side |
| Closed Positions Tab | Closed position history/trades | No trade model currently | None | Trade history entity and API missing | Add trade/fill persistence model and read APIs |
| Account Summary Widget | balance, equity, funds used, realized/unrealized/day/total pnl, current value | Account model includes balance/equity/pnl fields | `GET /accounts/{id}` | No dedicated normalized summary payload; no WS account/pnl updates | Add account summary endpoint and `account.update`/`pnl.update` topics |
| Terminal Connection State | ws connected/disconnected/reconnecting/error | WS manager exists | Basic WS endpoint | No protocol-level status/heartbeat messages | Add heartbeat and status envelopes; frontend reconnection state machine |
| Authentication Screens | login, refresh, logout, current user | User model exists | None | Auth not implemented in API routes | Implement JWT auth endpoints and auth dependencies |
| Multi-user data isolation | User-scoped resources | Models include user_id on accounts | None | No authorization checks in APIs/WS subscriptions | Add ownership checks in all account/order/position/trade endpoints and WS topic auth |

## Current Contract Breakages (Immediate)
- Frontend `placeOrder` posts to `/orders`, but backend expects `/accounts/{account_id}/orders/`.
- Frontend sends `instrument_symbol`, backend expects `instrument_id`.
- Frontend expects `account.balance` and `account.positions`; backend returns `current_balance` and no embedded positions.
- Frontend currently has only watchlist/order/positions placeholders, not locked terminal structure.

## Reuse First, Extend Second
- Reuse `OrderService` for all order-entry orchestration.
- Reuse `MarketDataProvider` and `ExecutionProvider` abstractions.
- Extend `websocket_manager` to topic/channel model instead of replacing it.
- Extend existing models and services with backward-compatible fields/endpoints.

## Scope Guardrails
- Do not add evaluation workflow, pass/fail scoring, funded-business logic, or challenge-rule automation in this phase.
- Existing risk/evaluation logic currently in code should be isolated or disabled behind feature flags for core-trading mode.

## Priority Gaps to Close First
1. Auth and user/account isolation.
2. API contract alignment for orders, positions, accounts.
3. Market data contract expansion (quotes, candles, option chain, depth).
4. Topicized websocket contract and frontend subscription model.
5. Locked terminal component structure and real backend integration.
