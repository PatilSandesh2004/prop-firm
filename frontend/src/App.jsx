import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  cancelOrder,
  getAccountSummary,
  getAccounts,
  getActiveInstruments,
  getAuthToken,
  getClosedPositions,
  getDepth,
  getQuotes,
  getExpiries,
  getMe,
  getOptionChain,
  getOrders,
  getPositions,
  getQuote,
  getTrades,
  login,
  placeOrder,
  register,
  setAuthToken,
  setOnTokenRefreshed,
} from './services/api';
import wsManager from './services/websocket';
import './index.css';

const DEFAULT_EMAIL = 'trader@propfirm.co';
const DEFAULT_PASSWORD = 'Trader@123';

function formatPercentage(value) {
  if (value === null || value === undefined || value === '') return '-';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '-';
  if (numericValue === 0) return '0.00%';
  const decimals = Math.abs(numericValue) >= 1 ? 2 : Math.abs(numericValue) >= 0.01 ? 3 : 4;
  return `${numericValue >= 0 ? '+' : ''}${numericValue.toFixed(decimals)}%`;
}

function formatFreshness(quotes, nowTick) {
  const timestamps = Object.values(quotes)
    .map((q) => new Date(q.timestamp).getTime())
    .filter((t) => Number.isFinite(t));
  if (!timestamps.length) return '';
  const mostRecent = Math.max(...timestamps);
  const secondsAgo = Math.max(0, Math.round((nowTick - mostRecent) / 1000));
  return `updated ${secondsAgo}s ago`;
}

function App() {
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [token, setToken] = useState(getAuthToken());
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const [instruments, setInstruments] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedUnderlying, setSelectedUnderlying] = useState('NIFTY');
  const [expiries, setExpiries] = useState([]);
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [selectedStrike, setSelectedStrike] = useState('');

  const [quotes, setQuotes] = useState({});
  const [depth, setDepth] = useState(null);
  const [optionChain, setOptionChain] = useState(null);
  const [orderTicket, setOrderTicket] = useState(null);
  const [orderLots, setOrderLots] = useState(1);
  const [orderSide, setOrderSide] = useState('BUY');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [closingInstrumentId, setClosingInstrumentId] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const [orders, setOrders] = useState([]);
  const [positions, setPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('positions');
  const [connectionState, setConnectionState] = useState('disconnected');

  const wsRefreshLock = useRef(0);
  const atmRowRef = useRef(null);

  const futures = useMemo(
    () => instruments.filter((i) => i.instrument_type === 'FUTURE'),
    [instruments],
  );

  const optionInstruments = useMemo(
    () => instruments.filter((i) => i.instrument_type === 'OPTION' && i.underlying === selectedUnderlying),
    [instruments, selectedUnderlying],
  );

  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || null,
    [accounts, selectedAccountId],
  );

  const selectedStrikeRow = useMemo(() => {
    if (!optionChain?.strikes?.length) return null;
    if (selectedStrike) {
      return optionChain.strikes.find((row) => row.strike === selectedStrike) || null;
    }
    return optionChain.strikes[0] || null;
  }, [optionChain, selectedStrike]);

  const callInstrument = useMemo(() => {
    if (!selectedStrikeRow?.call?.symbol) return null;
    return optionInstruments.find((i) => i.trading_symbol === selectedStrikeRow.call.symbol) || {
      id: selectedStrikeRow.call.instrument_id,
      trading_symbol: selectedStrikeRow.call.symbol,
      instrument_type: 'OPTION',
      option_type: 'CE',
      lot_size: selectedStrikeRow.call.lot_size || 1,
    };
  }, [optionInstruments, selectedStrikeRow]);

  const putInstrument = useMemo(() => {
    if (!selectedStrikeRow?.put?.symbol) return null;
    return optionInstruments.find((i) => i.trading_symbol === selectedStrikeRow.put.symbol) || {
      id: selectedStrikeRow.put.instrument_id,
      trading_symbol: selectedStrikeRow.put.symbol,
      instrument_type: 'OPTION',
      option_type: 'PE',
      lot_size: selectedStrikeRow.put.lot_size || 1,
    };
  }, [optionInstruments, selectedStrikeRow]);

  const liveChainItem = (item) => {
    if (!item) return null;
    const liveQuote = quotes[item.symbol];
    return liveQuote ? { ...item, ltp: liveQuote.ltp } : item;
  };

  const refreshAccountData = async (accountId) => {
    if (!accountId) {
      return;
    }
    const [o, p, cp, s, t] = await Promise.all([
      getOrders(accountId),
      getPositions(accountId),
      getClosedPositions(accountId),
      getAccountSummary(accountId),
      getTrades(accountId),
    ]);
    setOrders(o);
    setPositions(p);
    setClosedPositions(cp);
    setSummary(s);
    setTrades(t);
  };

  const refreshWatchQuotes = async (symbols) => {
    if (!symbols.length) return;
    try {
      const latest = await getQuotes(symbols);
      setQuotes((prev) => ({
        ...prev,
        ...Object.fromEntries(latest.map((quote) => [quote.symbol, quote])),
      }));
    } catch (e) {
      console.error('Market watch refresh failed', e);
    }
  };

  const refreshOptionChain = async () => {
    if (!selectedUnderlying || !selectedExpiry) return;
    try {
      const chain = await getOptionChain(selectedUnderlying, selectedExpiry);
      setOptionChain(chain);
      if (chain.atm_strike) {
        setSelectedStrike(chain.atm_strike);
      } else if (chain.strikes?.length) {
        setSelectedStrike(chain.strikes[Math.floor(chain.strikes.length / 2)].strike);
      }
    } catch (e) {
      console.error('Option chain fetch failed', e);
    }
  };

  const bootstrap = async () => {
    const me = await getMe();
    setUser(me);

    const [accs, insts] = await Promise.all([getAccounts(), getActiveInstruments()]);
    setAccounts(accs);
    setInstruments(insts);

    if (accs.length > 0) {
      const tradableAccount = accs.find((account) => account.status === 'ACTIVE') || accs[0];
      setSelectedAccountId(tradableAccount.id);
    }

    const defaultFuture = insts.find((i) => i.instrument_type === 'FUTURE' && i.underlying === 'NIFTY')
      || insts.find((i) => i.instrument_type === 'FUTURE');
    if (defaultFuture) {
      setSelectedSymbol(defaultFuture.trading_symbol);
      setSelectedUnderlying(defaultFuture.underlying);
    }
  };

  useEffect(() => {
    // Keeps React's `token` state in sync when api.js silently exchanges an
    // expired access token for a new one via the refresh token, and logs the
    // user out if that exchange fails (refresh token itself expired/revoked).
    setOnTokenRefreshed((result) => {
      setToken(result ? result.access_token : '');
      if (!result) {
        setUser(null);
        setAuthError('Session expired. Please login again.');
      }
    });
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    setAuthToken(token);
    bootstrap().catch(() => {
      setAuthError('Session expired. Please login again.');
      setAuthToken('', '');
      setToken('');
      setUser(null);
    });
  }, [token]);

  useEffect(() => {
    if (!selectedUnderlying) return;
    getExpiries(selectedUnderlying)
      .then((list) => {
        setExpiries(list);
        if (list.length && !selectedExpiry) {
          setSelectedExpiry(list[0]);
        }
      })
      .catch((e) => console.error('Expiries failed', e));
  }, [selectedUnderlying]);

  useEffect(() => {
    if (!selectedAccountId || !token) return;
    refreshAccountData(selectedAccountId).catch((e) => console.error(e));
  }, [selectedAccountId, token]);

  useEffect(() => {
    if (!selectedExpiry || !token) return;
    refreshOptionChain().catch((e) => console.error(e));
  }, [selectedUnderlying, selectedExpiry, token]);

  useEffect(() => {
    if (!token || !futures.length) return;
    const symbols = futures.map((future) => future.trading_symbol);
    refreshWatchQuotes(symbols).catch((e) => console.error(e));
    const timer = setInterval(() => {
      refreshWatchQuotes(symbols).catch((e) => console.error(e));
    }, 3000);
    return () => clearInterval(timer);
  }, [token, futures]);

  useEffect(() => {
    if (!token || !selectedUnderlying || !selectedExpiry) return;
    const timer = setInterval(() => {
      refreshOptionChain().catch((e) => console.error(e));
    }, 7000);
    return () => clearInterval(timer);
  }, [token, selectedUnderlying, selectedExpiry]);

  useEffect(() => {
    if (atmRowRef.current) {
      atmRowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [optionChain?.atm_strike]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) return;

    const quoteSymbols = futures.slice(0, 20).map((f) => f.trading_symbol);
    if (selectedSymbol && !quoteSymbols.includes(selectedSymbol)) {
      quoteSymbols.push(selectedSymbol);
    }
    if (callInstrument?.trading_symbol) quoteSymbols.push(callInstrument.trading_symbol);
    if (putInstrument?.trading_symbol) quoteSymbols.push(putInstrument.trading_symbol);
    // Every strike visible in the option chain table, not just the selected
    // (default: ATM) row. The backend already receives and caches a live
    // tick for every strike in the loaded chain (option_chain_service.py
    // subscribes the whole expiry's contracts to the Upstox feed on load) --
    // without this, the browser was never subscribed to the WS push for any
    // strike but the ATM one, so every other row only ever updated on the
    // 7s option-chain REST poll instead of in real time. That's the exact
    // "only ATM prices update" behavior reported.
    (optionChain?.strikes || []).forEach((row) => {
      if (row.call?.symbol) quoteSymbols.push(row.call.symbol);
      if (row.put?.symbol) quoteSymbols.push(row.put.symbol);
    });

    wsManager.setToken(token);
    wsManager.connect();
    wsManager.subscribeQuotes([...new Set(quoteSymbols)]);

    if (selectedAccountId) {
      wsManager.subscribeAccountTopics(selectedAccountId, [
        `account.${selectedAccountId}.orders`,
        `account.${selectedAccountId}.positions`,
        `account.${selectedAccountId}.summary`,
        `account.${selectedAccountId}.pnl`,
        `account.${selectedAccountId}.trades`,
      ]);
    }

    const onMessage = (msg) => {
      if (msg.type === 'system.connection') {
        setConnectionState(msg.payload?.state || 'unknown');
        return;
      }

      // Legacy quote payload support
      if (msg.symbol && msg.ltp !== undefined) {
        setQuotes((prev) => ({ ...prev, [msg.symbol]: msg }));
        setOptionChain((prev) => {
          if (!prev?.strikes) return prev;
          return {
            ...prev,
            strikes: prev.strikes.map((row) => ({
              ...row,
              call: row.call?.symbol === msg.symbol ? { ...row.call, ltp: msg.ltp } : row.call,
              put: row.put?.symbol === msg.symbol ? { ...row.put, ltp: msg.ltp } : row.put,
            })),
          };
        });
        return;
      }

      if (
        [
          `account.${selectedAccountId}.orders`,
          `account.${selectedAccountId}.positions`,
          `account.${selectedAccountId}.summary`,
          `account.${selectedAccountId}.pnl`,
          `account.${selectedAccountId}.trades`,
        ].includes(msg.type)
      ) {
        const now = Date.now();
        if (now - wsRefreshLock.current > 600) {
          wsRefreshLock.current = now;
          refreshAccountData(selectedAccountId).catch((e) => console.error(e));
        }
      }
    };

    wsManager.addListener(onMessage);
    return () => {
      wsManager.removeListener(onMessage);
    };
  }, [token, selectedAccountId, selectedSymbol, futures, callInstrument, putInstrument, optionChain]);

  const onLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const result = authMode === 'register'
        ? await register(email, password)
        : await login(email, password);
      setAuthToken(result.access_token, result.refresh_token);
      setToken(result.access_token);
    } catch (e) {
      setAuthError(e.response?.data?.detail || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const submitOrder = async (instrument, side, lots = 1, orderType = 'MARKET', price = null) => {
    if (!instrument || !selectedAccountId) return;
    if (activeAccount?.status !== 'ACTIVE') {
      setOrderError(`Account is ${activeAccount?.status || 'unavailable'}. Select an ACTIVE evaluation account before buying.`);
      return;
    }
    if (instrument.instrument_type !== 'OPTION') {
      setOrderError('Only option-chain instruments can be traded.');
      return;
    }
    const quantity = Math.max(1, Number(lots || 1)) * Number(instrument.lot_size || 1);
    setOrderSubmitting(true);
    setOrderError('');
    try {
      await placeOrder(selectedAccountId, {
        instrument_id: instrument.id,
        side,
        order_type: orderType,
        quantity,
        price: orderType === 'LIMIT' ? price : null,
        trigger_price: null,
      });
      await refreshAccountData(selectedAccountId);
      setOrderTicket(null);
    } catch (e) {
      const detail = e.response?.data?.detail;
      setOrderError(
        detail === 'Not Found'
          ? 'This live option contract has changed. Close this ticket, refresh the chain, and select the latest price.'
          : detail || 'Order could not be executed. Please refresh the option chain and try again.',
      );
    } finally {
      setOrderSubmitting(false);
    }
  };

  const openOptionTicket = async (chainItem) => {
    if (!chainItem) return;
    const instrument = {
      id: chainItem.instrument_id,
      trading_symbol: chainItem.symbol,
      instrument_type: 'OPTION',
      lot_size: chainItem.lot_size || 1,
      option_type: chainItem.option_type,
    };
    setOrderTicket(instrument);
    setOrderLots(1);
    setOrderSide('BUY');
    setOrderError('');
    try {
      setDepth(await getDepth(chainItem.symbol));
    } catch {
      setDepth(null);
    }
  };

  const closePosition = async (position) => {
    if (!selectedAccountId || !position?.quantity) return;
    setClosingInstrumentId(position.instrument_id);
    setOrderError('');
    try {
      await placeOrder(selectedAccountId, {
        instrument_id: position.instrument_id,
        side: position.quantity > 0 ? 'SELL' : 'BUY',
        order_type: 'MARKET',
        quantity: Math.abs(position.quantity),
        price: null,
        trigger_price: null,
      });
      await refreshAccountData(selectedAccountId);
    } catch (e) {
      setOrderError(e.response?.data?.detail || 'Could not close this position. Please try again.');
    } finally {
      setClosingInstrumentId(null);
    }
  };

  const renderTabTable = () => {
    if (activeTab === 'positions') {
      return (
        <table className="terminal-table">
          <thead>
            <tr>
              <th>Instrument</th><th>Side</th><th>Lots</th><th>Qty</th><th>Avg</th><th>LTP</th><th>Invested</th><th>Current</th><th>Unrealized</th><th>Realized</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={`${p.instrument_id}-${p.status}`}>
                <td>{p.trading_symbol}</td>
                <td>{p.side}</td>
                <td>{p.lots}</td>
                <td>{p.quantity}</td>
                <td>{Number(p.average_entry_price).toFixed(2)}</td>
                <td>{p.ltp ? Number(p.ltp).toFixed(2) : '-'}</td>
                <td>{Number(p.invested_value).toFixed(2)}</td>
                <td>{Number(p.current_value).toFixed(2)}</td>
                <td className={Number(p.unrealized_pnl) >= 0 ? 'up-text' : 'down-text'}>{Number(p.unrealized_pnl).toFixed(2)}</td>
                <td>{Number(p.realized_pnl).toFixed(2)}</td>
                <td>{p.status}</td>
                <td>
                  {p.status === 'OPEN' && (
                    <button
                      className="small-btn sell-btn"
                      disabled={closingInstrumentId === p.instrument_id}
                      onClick={() => closePosition(p)}
                    >
                      {closingInstrumentId === p.instrument_id ? '...' : 'Close'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'orders') {
      return (
        <table className="terminal-table">
          <thead>
            <tr>
              <th>Order ID</th><th>Side</th><th>Type</th><th>Qty</th><th>Filled</th><th>Status</th><th>Avg</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id.slice(0, 8)}</td>
                <td>{o.side}</td>
                <td>{o.order_type}</td>
                <td>{o.quantity}</td>
                <td>{o.filled_quantity}</td>
                <td>{o.status}</td>
                <td>{o.average_price ? Number(o.average_price).toFixed(2) : '-'}</td>
                <td>
                  {(o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED') ? (
                    <button className="small-btn" onClick={() => cancelOrder(selectedAccountId, o.id).then(() => refreshAccountData(selectedAccountId))}>Cancel</button>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'closed') {
      return (
        <table className="terminal-table">
          <thead>
            <tr>
              <th>Instrument</th><th>Qty</th><th>Realized</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {closedPositions.map((p) => (
              <tr key={`${p.instrument_id}-closed`}>
                <td>{p.trading_symbol}</td>
                <td>{p.quantity}</td>
                <td className={Number(p.realized_pnl) >= 0 ? 'up-text' : 'down-text'}>{Number(p.realized_pnl).toFixed(2)}</td>
                <td>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <table className="terminal-table">
        <thead>
          <tr>
            <th>Time</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Price</th><th>Notional</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id}>
              <td>{new Date(t.created_at).toLocaleTimeString()}</td>
              <td>{t.trading_symbol}</td>
              <td>{t.side}</td>
              <td>{t.quantity}</td>
              <td>{Number(t.price).toFixed(2)}</td>
              <td>{Number(t.notional).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (!token || !user) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Indian F&O Trading Terminal</h1>
          <p>Secure login required</p>
          <input
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button className="primary-btn" onClick={onLogin} disabled={authLoading}>
            {authLoading ? 'Please wait...' : authMode === 'register' ? 'Create Simulation Account' : 'Login'}
          </button>
          <button className="secondary-btn" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} disabled={authLoading}>
            {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
          {authError && <div className="error-text">{authError}</div>}
        </div>
      </div>
    );
  }

  const topTickers = ['NIFTY-FUT', 'BANKNIFTY-FUT', 'SENSEX-FUT'];
  const liveMarket = Object.values(quotes).some((quote) => quote.source?.startsWith('UPSTOX'));

  return (
    <div className="terminal-root">
      <header className="top-bar">
        <div className="brand">PropTrade F&O Terminal</div>
        <div className="sim-badge">{liveMarket ? 'LIVE MARKET · EVALUATION ACCOUNT' : 'MARKET CONNECTING'}</div>
        <div className="ticker-strip">
          {topTickers.map((symbol) => {
            const q = quotes[symbol];
            const ch = Number(q?.change || 0);
            return (
              <div key={symbol} className="ticker-item" title={q ? `bid ${Number(q.bid).toFixed(2)} / ask ${Number(q.ask).toFixed(2)} · vol ${q.volume} · ${q.source}` : ''}>
                {q?.is_stale && <span className="dot bad" title="Feed hasn't ticked recently" />}
                <span className="ticker-symbol">{symbol}</span>
                <span>{q ? Number(q.ltp).toFixed(2) : '--'}</span>
                <span className={ch >= 0 ? 'up-text' : 'down-text'}>
                  {q ? `${ch >= 0 ? '+' : ''}${ch.toFixed(2)} (${formatPercentage(q.change_pct)})` : '--'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="top-right">
          <span className={`dot ${connectionState === 'connected' ? 'ok' : 'bad'}`} />
          <span>{connectionState.toUpperCase()}</span>
          <span className="stale-indicator">{formatFreshness(quotes, nowTick)}</span>
          <span className="user-pill">{user.email}</span>
        </div>
      </header>

      <aside className="left-nav">
        <div className="nav-item active">Trading</div>
        <div className="nav-item">Terminal</div>
        <div className="nav-item">Scanner</div>
        <div className="nav-item">Strategy</div>
        <div className="watchlist-panel">
          <h3>Market Watch</h3>
          {futures.map((f) => {
            const q = quotes[f.trading_symbol];
            return (
              <button
                key={f.id}
                className={`watch-item ${selectedSymbol === f.trading_symbol ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedSymbol(f.trading_symbol);
                  setSelectedUnderlying(f.underlying);
                }}
              >
                <div>{f.trading_symbol}</div>
                <div className={Number(q?.change || 0) >= 0 ? 'up-text' : 'down-text'}>
                  {q ? Number(q.ltp).toFixed(2) : '--'}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="main-workspace">
        <section className="panel right-panel">
          <div className="section-head">
            <h3>Option Chain & Depth</h3>
            <div className="selectors">
              <select value={selectedUnderlying} onChange={(e) => setSelectedUnderlying(e.target.value)}>
                {[...new Set(futures.map((f) => f.underlying))].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <select value={selectedExpiry} onChange={(e) => setSelectedExpiry(e.target.value)}>
                {expiries.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
              </select>
              <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}>
                {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.account_type} {acc.id.slice(0, 6)} · {acc.status}</option>)}
              </select>
            </div>
          </div>

          <div className="chain-summary">
            <span>LIVE LTP</span>
            <strong>{optionChain?.spot_price ? Number(optionChain.spot_price).toFixed(2) : '--'}</strong>
            <span>ATM</span>
            <strong>{optionChain?.atm_strike || '--'}</strong>
            <span className="chain-help">Click any CALL or PUT LTP to open a BUY ticket</span>
          </div>

          <div className="option-chain">
            <table className="terminal-table compact">
              <thead>
                <tr>
                  <th>Call OI</th><th>Call LTP</th><th>Call %</th><th>Strike</th><th>Put %</th><th>Put LTP</th><th>Put OI</th>
                </tr>
              </thead>
              <tbody>
                {(optionChain?.strikes || []).map((row) => (
                  <tr ref={row.strike === optionChain?.atm_strike ? atmRowRef : null} key={row.strike} className={`${selectedStrike === row.strike ? 'selected-row' : ''} ${row.strike === optionChain?.atm_strike ? 'atm-row' : ''}`} onClick={() => setSelectedStrike(row.strike)}>
                    <td>{row.call?.oi ?? '-'}</td>
                    <td>
                      <button className="chain-price" disabled={!row.call} onClick={(event) => { event.stopPropagation(); openOptionTicket(row.call); }}>
                        {liveChainItem(row.call)?.ltp ?? '-'}
                      </button>
                    </td>
                    <td className={Number(row.call?.change_pct || 0) >= 0 ? 'up-text' : 'down-text'}>
                      {formatPercentage(row.call?.change_pct)}
                    </td>
                    <td>{row.strike}</td>
                    <td className={Number(row.put?.change_pct || 0) >= 0 ? 'up-text' : 'down-text'}>
                      {formatPercentage(row.put?.change_pct)}
                    </td>
                    <td>
                      <button className="chain-price" disabled={!row.put} onClick={(event) => { event.stopPropagation(); openOptionTicket(row.put); }}>
                        {liveChainItem(row.put)?.ltp ?? '-'}
                      </button>
                    </td>
                    <td>{row.put?.oi ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="depth-grid">
            <div>
              <h4>Bids</h4>
              {(depth?.bids || []).slice(0, 5).map((b, idx) => <div key={`b-${idx}`} className="depth-row"><span>{Number(b.price).toFixed(2)}</span><span>{b.quantity}</span></div>)}
            </div>
            <div>
              <h4>Asks</h4>
              {(depth?.asks || []).slice(0, 5).map((a, idx) => <div key={`a-${idx}`} className="depth-row"><span>{Number(a.price).toFixed(2)}</span><span>{a.quantity}</span></div>)}
            </div>
          </div>
        </section>
      </main>

      <section className="bottom-panel panel">
        <div className="tabs">
          <button className={activeTab === 'positions' ? 'active' : ''} onClick={() => setActiveTab('positions')}>Positions</button>
          <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>Orders</button>
          <button className={activeTab === 'closed' ? 'active' : ''} onClick={() => setActiveTab('closed')}>Closed Positions</button>
          <button className={activeTab === 'trades' ? 'active' : ''} onClick={() => setActiveTab('trades')}>Trade History</button>
        </div>
        <div className="table-wrap">{renderTabTable()}</div>
      </section>

      <section className="account-strip panel">
        <div className="sim-note">Execution: {liveMarket ? 'Live Upstox data' : 'Connecting to market data'} · Options only, buy or sell</div>
        <div>Funds Used: {summary ? Number(summary.funds_used).toFixed(2) : '--'}</div>
        <div>Current Value: {summary ? Number(summary.current_value).toFixed(2) : '--'}</div>
        <div className={summary && Number(summary.unrealized_pnl) >= 0 ? 'up-text' : 'down-text'}>
          Unrealized P&L: {summary ? Number(summary.unrealized_pnl).toFixed(2) : '--'}
        </div>
        <div className={summary && Number(summary.realized_pnl) >= 0 ? 'up-text' : 'down-text'}>
          Realized P&L: {summary ? Number(summary.realized_pnl).toFixed(2) : '--'}
        </div>
        <div className={summary && Number(summary.total_pnl) >= 0 ? 'up-text' : 'down-text'}>
          Total P&L: {summary ? Number(summary.total_pnl).toFixed(2) : '--'}
        </div>
        <div>Balance: {summary ? Number(summary.balance).toFixed(2) : '--'}</div>
        <div>Equity: {summary ? Number(summary.equity).toFixed(2) : '--'}</div>
      </section>

      {orderTicket && (
        <div className="modal-backdrop" onClick={() => setOrderTicket(null)}>
          <div className="order-modal" onClick={(event) => event.stopPropagation()}>
            <div className="section-head">
              <h2>{orderSide} OPTION</h2>
              <button className="secondary-btn" onClick={() => setOrderTicket(null)}>Close</button>
            </div>
            <div className="modal-symbol">{orderTicket.trading_symbol}</div>
            <div className="side-toggle">
              <button
                type="button"
                className={`small-btn buy-btn ${orderSide === 'BUY' ? 'active' : ''}`}
                onClick={() => setOrderSide('BUY')}
              >
                BUY
              </button>
              <button
                type="button"
                className={`small-btn sell-btn ${orderSide === 'SELL' ? 'active' : ''}`}
                onClick={() => setOrderSide('SELL')}
              >
                SELL
              </button>
            </div>
            <label htmlFor="option-lots">Lots</label>
            <input id="option-lots" type="number" min="1" value={orderLots} onChange={(event) => setOrderLots(event.target.value)} />
            {orderSide === 'SELL' && (
              <div className="trade-rule">
                Selling beyond an existing long opens a new short position, subject to margin.
              </div>
            )}
            {orderError && <div className="error-text">{orderError}</div>}
            <button
              className={`modal-submit ${orderSide === 'BUY' ? 'buy-btn' : 'sell-btn'}`}
              disabled={orderSubmitting}
              onClick={() => submitOrder(orderTicket, orderSide, orderLots)}
            >
              {orderSubmitting ? 'Submitting...' : `${orderSide} ${orderTicket.option_type || 'OPTION'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
