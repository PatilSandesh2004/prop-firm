# 04 WebSocket Contract

## Purpose
Defines the real-time channel contract required by the trading terminal. Extends current symbol-subscription WebSocket implementation into topic-based subscriptions with efficient updates.

## Connection
- URL: `/api/v1/ws/market-data` (and temporary compatibility alias `/ws/market-data` if retained)
- Auth: Bearer token via query param or subprotocol/header strategy (final approach to be standardized in backend)

## Message Envelope
All messages should use a common envelope:
- `type: string` (event type)
- `topic: string` (logical topic)
- `ts: string` (ISO timestamp)
- `request_id?: string`
- `payload: object`

## Client -> Server Messages

### Subscribe
```json
{
  "action": "subscribe",
  "subscriptions": [
    { "topic": "market.quote", "symbols": ["NIFTY-FUT", "BANKNIFTY-FUT"] },
    { "topic": "market.depth", "symbols": ["NIFTY-FUT"] },
    { "topic": "market.option_chain", "underlying": "NIFTY", "expiry": "2026-08-27" },
    { "topic": "orders.update", "account_id": "<uuid>" },
    { "topic": "positions.update", "account_id": "<uuid>" },
    { "topic": "account.update", "account_id": "<uuid>" },
    { "topic": "pnl.update", "account_id": "<uuid>" }
  ]
}
```

### Unsubscribe
```json
{
  "action": "unsubscribe",
  "subscriptions": [
    { "topic": "market.quote", "symbols": ["NIFTY-FUT"] }
  ]
}
```

### Ping
```json
{
  "action": "ping"
}
```

## Server -> Client Control Messages

### Connected
```json
{
  "type": "system.connected",
  "topic": "system",
  "ts": "2026-08-19T10:00:00Z",
  "payload": {
    "connection_id": "<id>",
    "server_time": "2026-08-19T10:00:00Z"
  }
}
```

### Subscription Acknowledged
```json
{
  "type": "system.subscribed",
  "topic": "system",
  "ts": "2026-08-19T10:00:01Z",
  "payload": {
    "accepted": [ ... ],
    "rejected": [ ... ]
  }
}
```

### Pong
```json
{
  "type": "system.pong",
  "topic": "system",
  "ts": "2026-08-19T10:00:02Z",
  "payload": {}
}
```

### Error
```json
{
  "type": "system.error",
  "topic": "system",
  "ts": "2026-08-19T10:00:03Z",
  "payload": {
    "code": "FORBIDDEN",
    "message": "Account access denied"
  }
}
```

## Server -> Client Data Topics

### `market.quote`
Payload per symbol delta:
- `symbol`, `ltp`, `bid`, `ask`, `open`, `high`, `low`, `prev_close`, `change`, `change_pct`, `volume`, `open_interest`, `source`, `is_stale`

### `market.depth`
Payload:
- `symbol`
- `bids: [{ price, quantity, orders? }]`
- `asks: [{ price, quantity, orders? }]`
- `timestamp`

### `market.candle`
Payload:
- `symbol`, `timeframe`
- `candle: { t, o, h, l, c, v, closed }`

### `market.option_chain`
Payload:
- `underlying`, `expiry`, `spot_price`, `updated_at`
- `strikes: [{ strike, call: {...}, put: {...} }]`

### `orders.update`
Payload:
- `account_id`
- `order: { id, status, filled_quantity, average_price, rejection_reason?, updated_at }`

### `positions.update`
Payload:
- `account_id`
- `position: { instrument_id, trading_symbol, lots, quantity, avg_entry, ltp, invested_value, current_value, realized_pnl, unrealized_pnl, day_pnl, status }`

### `account.update`
Payload:
- `account_id`
- `balance`, `equity`, `funds_used`, `current_value`, `updated_at`

### `pnl.update`
Payload:
- `account_id`
- `realized_pnl`, `unrealized_pnl`, `day_pnl`, `total_pnl`, `updated_at`

## Delivery Rules
- Send deltas, not full app state, for high-frequency topics.
- Guarantee account/topic authorization before subscribing.
- Drop unauthorized subscription attempts with explicit error codes.
- Include stale/disconnected indicators when provider health degrades.

## Frontend Integration Rules
- Maintain a single WS connection manager with:
  - reconnect with backoff
  - resubscribe on reconnect
  - connection-status store
  - component-level subscription lifecycle cleanup
- Use topic-specific stores/selectors to avoid terminal-wide rerenders.

## Compatibility Notes
- Existing message shape (`{ action, symbols }` subscribe and raw quote payload) should remain temporarily supported during migration.
- New envelope/topic contract becomes primary once frontend migrates.
