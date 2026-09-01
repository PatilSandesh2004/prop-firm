# 05 Implementation Plan

## Objective
Align existing backend architecture and current frontend into a working, production-oriented Indian F&O trading terminal that matches the locked layout and uses backend APIs/WebSockets as the source of truth.

## Guiding Rules
- Reuse existing market-data, execution, order, and PnL components.
- Prefer backward-compatible extensions.
- Do not introduce evaluation/pass/fail/challenge workflow features in this phase.
- Keep backend authoritative for financial state.

## Phase 1: Audit and Gap Analysis (Completed)
Deliverables completed:
- `01_BACKEND_AUDIT.md`
- `02_FRONTEND_BACKEND_GAP_ANALYSIS.md`
- `03_API_CONTRACT.md`
- `04_WEBSOCKET_CONTRACT.md`
- `05_IMPLEMENTATION_PLAN.md`

## Phase 2: Contract Alignment (Backend First)
### 2.1 Security Foundation
- Add auth endpoints (`/auth/login`, `/auth/me`, refresh/logout path).
- Add account-ownership checks to all private resources.
- Add WS authentication and topic authorization.

### 2.2 API Expansion (No Duplicates)
- Extend existing routers with:
  - market quotes/depth/candles/option-chain
  - account summary
  - orders list/detail/cancel/modify
  - positions open/closed
  - trades history
- Preserve existing endpoint behavior where already consumed.

### 2.3 WebSocket Topicization
- Extend existing `websocket_manager` to topic subscriptions.
- Add `market.quote`, `market.depth`, `market.candle`, `market.option_chain`, `orders.update`, `positions.update`, `account.update`, `pnl.update`.
- Add control messages and heartbeat.

## Phase 3: Core Trading Backend Alignment
### 3.1 Instruments and F&O Master Data
- Keep existing `Instrument` model.
- Add missing Indian F&O metadata only if needed for terminal and provider mapping.
- Implement instrument universe sync/seed strategy for options chain data.

### 3.2 Market Data Services
- Add quote snapshot service.
- Add candle service (REST bootstrap + incremental WS updates).
- Add option chain service (underlying -> expiry -> strike -> CE/PE rows).
- Add dedicated depth read path.

### 3.3 Order and Execution
- Keep `OrderService` as orchestration entrypoint.
- Tighten order type support to actual capabilities.
- Improve matching-engine lifecycle for supported types.
- Keep provider abstraction intact.

### 3.4 Positions and PnL
- Add read models for terminal display fields.
- Complete realized PnL calculations on reductions/reversals.
- Add account summary calculation endpoint from one canonical source.

## Phase 4: Locked Frontend Foundation
### 4.1 Layout
- Implement locked desktop terminal structure:
  - top ticker bar
  - left sidebar
  - central chart + call/put panels
  - right option-chain/depth panel
  - bottom tabbed positions/orders/closed positions + account summary

### 4.2 State Architecture
- Separate server state and UI state.
- Use subscription-scoped stores/selectors to prevent full rerenders.

### 4.3 Component Integration
- Wire every panel to real backend contracts.
- Keep disconnected/loading/empty/error states explicit.

## Phase 5: End-to-End Integration Validation
- Verify flow:
  - login -> instrument select -> quote -> chart -> option chain -> order entry -> execution -> order update -> position -> pnl -> account summary
- Remove temporary mock data.
- Validate lot-size based quantity behavior from backend data.

## Phase 6: Hardening and Tests
### 6.1 Backend Tests
- Market data: instruments, quotes, candles, chain, depth, ws updates.
- Orders: valid/invalid/lifecycle/execution/fill.
- Positions: create/update/close.
- PnL: unrealized/realized/account totals with price updates.
- Auth: isolation and unauthorized access.
- WS: connect/subscribe/update/disconnect/reconnect.

### 6.2 Frontend Tests
- Component loading/error/disconnected states.
- WS reconnect and resubscription behavior.
- Critical order-entry and positions rendering paths.

### 6.3 Ops
- Docker runbook updates.
- Environment variable documentation.
- Production security and CORS tightening.

## Sequencing and Estimated Work Packets
1. Backend auth + authorization scaffolding.
2. Orders/positions/account-summary APIs and contract fixes.
3. Market data REST/WS expansion (quotes/depth/candles/chain).
4. Frontend layout rewrite to locked terminal design.
5. Full backend integration and cleanup.
6. Tests and hardening.

## Risk Register
- Existing evaluation-rule coupling in `risk_engine` may interfere with current scope.
- Limited provider data for depth/greeks/IV may require documented partial support.
- Current frontend/backend contract mismatch can break basic order flow until fixed.
- Dual table-management paths (startup auto-create + Alembic) can cause schema drift.

## Exit Criteria for This Plan
- All acceptance criteria in the master prompt are verifiably met for core trading scope.
- No fake production market data path remains.
- No evaluation/pass/fail workflow is introduced in active core-trading functionality.
