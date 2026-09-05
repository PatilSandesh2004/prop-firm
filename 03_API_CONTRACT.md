# 03 API Contract

## Purpose
Defines the backend REST contract required by the locked trading terminal while preserving and extending existing backend architecture.

## Versioning and Compatibility
- Base path: `/api/v1`
- Backward compatibility:
  - Keep existing endpoints operational where practical.
  - Add new endpoints for terminal requirements.
  - Deprecate only with explicit migration notes.

## Authentication

### POST `/auth/login`
- Request:
  - `email: string`
  - `password: string`
- Response:
  - `access_token: string`
  - `token_type: "bearer"`
  - `expires_in: number`
  - `user: { id, email, role }`

### POST `/auth/refresh`
- Request: refresh token/session token (implementation choice)
- Response: new access token payload

### POST `/auth/logout`
- Auth required
- Response: success status

### GET `/auth/me`
- Auth required
- Response: current user profile and account access metadata

## Health

### GET `/health`
### GET `/api/v1/health`
- Existing endpoint.
- Response includes service status, database status, redis status.

## Accounts

### GET `/me/accounts`
- Auth required
- Returns only accounts owned by authenticated user.

### GET `/accounts/{account_id}`
- Auth required
- Ownership enforced.
- Existing endpoint can be retained with added authorization checks.

### GET `/accounts/{account_id}/summary`
- Auth required
- Response shape:
  - `account_id`
  - `balance`
  - `equity`
  - `funds_used`
  - `current_value`
  - `realized_pnl`
  - `unrealized_pnl`
  - `day_pnl`
  - `total_pnl`
  - `updated_at`

## Instruments

### GET `/instruments`
- Existing endpoint with filters; retain.
- Query support:
  - `underlying`
  - `instrument_type`
  - `option_type`
  - `expiry_date`
  - `strike_price`
  - `skip`
  - `limit`

### GET `/instruments/{instrument_id}`
- Existing; retain.

### GET `/instruments/underlyings`
- New.
- Returns available underlyings (NIFTY/BANKNIFTY/etc).

### GET `/instruments/expiries`
- New.
- Query: `underlying`
- Returns available expiries for selected underlying.

## Market Data

### GET `/market/quotes`
- Query: `symbols=comma,separated,list`
- Response: quote snapshots keyed by symbol.
- Quote fields (where available):
  - `symbol`, `ltp`, `bid`, `ask`, `open`, `high`, `low`, `prev_close`, `change`, `change_pct`, `volume`, `open_interest`, `timestamp`, `source`, `is_stale`

### GET `/market/depth`
- Query: `symbol`
- Response: top levels bids/asks and timestamp.

### GET `/market/candles`
- Query:
  - `symbol`
  - `timeframe` (e.g. 1m, 5m, 15m, 1h, 1d based on provider support)
  - `from`
  - `to`
  - `limit`
- Response: array of OHLCV candles.

### GET `/market/option-chain`
- Query:
  - `underlying`
  - `expiry`
- Response:
  - `underlying`
  - `expiry`
  - `spot_price`
  - `updated_at`
  - `strikes: [ { strike, call: {...}, put: {...} } ]`
- Include IV/Greeks only if provider supports and values are available.

## Orders

### POST `/accounts/{account_id}/orders`
- Existing endpoint; retain.
- Request:
  - `instrument_id`
  - `side`
  - `order_type`
  - `quantity`
  - `price?`
  - `trigger_price?`
- Response: order record with lifecycle status.

### GET `/accounts/{account_id}/orders`
- New.
- Query: status, symbol/instrument_id, date range, pagination.

### GET `/accounts/{account_id}/orders/{order_id}`
- New.

### POST `/accounts/{account_id}/orders/{order_id}/cancel`
- New.

### POST `/accounts/{account_id}/orders/{order_id}/modify`
- New.
- Only for supported provider/order states.

### GET `/accounts/{account_id}/orders/margin-preview`
- Auth required
- Query parameters:
  - `instrument_id: UUID`
  - `side: "BUY" | "SELL"`
  - `quantity: integer`
- Response shape:
  - `required_amount: number`
  - `available_amount: number`
  - `sufficient: boolean`
  - `ltp: number | null`

### GET `/orders/capabilities`
- New.
- Returns supported order types per execution mode/provider and current market session constraints.

## Positions and Trades

### GET `/accounts/{account_id}/positions`
- New.
- Response rows should include terminal display fields:
  - `instrument_id`, `trading_symbol`, `underlying`, `expiry`, `strike`, `option_type`
  - `side`, `lots`, `quantity`
  - `average_entry_price`
  - `ltp`
  - `invested_value`
  - `current_value`
  - `realized_pnl`
  - `unrealized_pnl`
  - `day_pnl`
  - `product`
  - `status`

### GET `/accounts/{account_id}/positions/closed`
- New.

### GET `/accounts/{account_id}/trades`
- New.
- Trade/fill history.

## Error Contract
All endpoints should return consistent error envelope:
- `code: string`
- `message: string`
- `details: object | null`
- `request_id: string`

Representative codes:
- `AUTH_REQUIRED`
- `FORBIDDEN`
- `ACCOUNT_NOT_FOUND`
- `INSTRUMENT_NOT_FOUND`
- `ORDER_REJECTED`
- `MARKET_DATA_UNAVAILABLE`
- `PROVIDER_UNAVAILABLE`
- `VALIDATION_ERROR`

## Non-Goals for This Phase
- No challenge evaluation scoring workflow.
- No pass/fail evaluation automation exposed to terminal APIs.
- No payout/funded business workflow APIs in current core-trading phase.
