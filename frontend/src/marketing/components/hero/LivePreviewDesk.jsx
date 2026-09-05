import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, Layers, ShieldCheck, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Badge from '../common/Badge';

export default function LivePreviewDesk() {
  const [selectedTab, setSelectedTab] = useState('NIFTY');
  const [niftyLtp, setNiftyLtp] = useState(25084.5);
  const [niftyChange, setNiftyChange] = useState(0.48);
  const [bankniftyLtp, setBankniftyLtp] = useState(52140.0);
  const [bankniftyChange, setBankniftyChange] = useState(0.62);
  const [pnlValue, setPnlValue] = useState(2450.0);

  // Subtle live tick simulation to create an authentic dynamic terminal aesthetic
  useEffect(() => {
    const interval = setInterval(() => {
      const deltaNifty = (Math.random() - 0.48) * 1.5;
      const deltaBank = (Math.random() - 0.47) * 4.0;
      setNiftyLtp((prev) => +(prev + deltaNifty).toFixed(2));
      setBankniftyLtp((prev) => +(prev + deltaBank).toFixed(2));
      setPnlValue((prev) => +(prev + deltaNifty * 25).toFixed(2));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const isNifty = selectedTab === 'NIFTY';
  const currentLtp = isNifty ? niftyLtp : bankniftyLtp;
  const currentChange = isNifty ? niftyChange : bankniftyChange;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(180deg, rgba(20, 28, 45, 0.95) 0%, rgba(12, 17, 28, 0.98) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(16, 185, 129, 0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Terminal Titlebar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          background: 'rgba(7, 10, 16, 0.8)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
          <span
            className="font-mono"
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              marginLeft: '0.5rem',
              letterSpacing: '0.05em',
            }}
          >
            PROPFIRM DESK v2.4 • FAST ORDER ROUTING
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              color: 'var(--accent-cyan)',
              background: 'rgba(6, 182, 212, 0.1)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <span className="pulse-dot" style={{ width: 5, height: 5, backgroundColor: '#06b6d4' }} />
            TRADING ENVIRONMENT
          </span>
        </div>
      </div>

      {/* Terminal Ticker & Instrument Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          background: 'rgba(16, 23, 38, 0.6)',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setSelectedTab('NIFTY')}
            style={{
              background: isNifty ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isNifty ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
              color: isNifty ? '#34d399' : 'var(--text-secondary)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            NIFTY 50 (LOT 25)
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('BANKNIFTY')}
            style={{
              background: !isNifty ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${!isNifty ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
              color: !isNifty ? '#34d399' : 'var(--text-secondary)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            BANKNIFTY (LOT 15)
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LTP:</span>
          <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
            ₹{currentLtp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--accent-emerald-light)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <ArrowUpRight size={14} /> +{currentChange}%
          </span>
        </div>
      </div>

      {/* Terminal Visual Body: Chart + Depth */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: '1px',
          background: 'var(--border-subtle)',
        }}
      >
        {/* Left: Interactive Candlestick Area */}
        <div style={{ background: '#0d1322', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              {isNifty ? 'NIFTY 50' : 'BANKNIFTY'} • 1M CANDLES
            </span>
            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              VOL: 1.48M • HIGH: ₹{isNifty ? '25,120.00' : '52,290.00'} • LOW: ₹{isNifty ? '24,990.00' : '51,920.00'}
            </span>
          </div>

          {/* Canvas SVG Chart */}
          <div style={{ width: '100%', height: 130, position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 320 130" fill="none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Horizontal Grid lines */}
              <line x1="0" y1="30" x2="320" y2="30" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="320" y2="70" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="320" y2="110" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />

              {/* Area fill */}
              <path
                d="M 10 95 L 45 88 L 80 102 L 120 72 L 160 85 L 200 55 L 240 60 L 280 38 L 310 25 L 310 130 L 10 130 Z"
                fill="url(#chartGrad)"
              />
              {/* Price Stroke */}
              <path
                d="M 10 95 L 45 88 L 80 102 L 120 72 L 160 85 L 200 55 L 240 60 L 280 38 L 310 25"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Current Price Dot */}
              <circle cx="310" cy="25" r="4" fill="#34d399" />
              <circle cx="310" cy="25" r="7" stroke="#10b981" strokeWidth="1" opacity="0.6" />
            </svg>
          </div>

          {/* Quick Stats Strip */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Daily Max Loss: </span>
              <span className="font-mono" style={{ color: '#ffffff', fontWeight: 600 }}>₹25,000</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Utilized Margin: </span>
              <span className="font-mono" style={{ color: '#38bdf8', fontWeight: 600 }}>₹42,500</span>
            </div>
          </div>
        </div>

        {/* Right: Live Market Depth & Top Book */}
        <div style={{ background: '#0f1627', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              LIVE DEPTH (TOP 3)
            </span>
            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent-emerald-light)' }}>
              FAST MATCH
            </span>
          </div>

          <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse' }} className="font-mono">
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ textAlign: 'left', paddingBottom: 4 }}>BID (QTY)</th>
                <th style={{ textAlign: 'right', paddingBottom: 4 }}>ASK (QTY)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: '#34d399', padding: '3px 0' }}>₹{(currentLtp - 0.25).toFixed(2)} (450)</td>
                <td style={{ color: '#f87171', textAlign: 'right', padding: '3px 0' }}>₹{(currentLtp + 0.25).toFixed(2)} (375)</td>
              </tr>
              <tr>
                <td style={{ color: '#34d399', padding: '3px 0' }}>₹{(currentLtp - 0.5).toFixed(2)} (1,200)</td>
                <td style={{ color: '#f87171', textAlign: 'right', padding: '3px 0' }}>₹{(currentLtp + 0.5).toFixed(2)} (825)</td>
              </tr>
              <tr>
                <td style={{ color: '#34d399', padding: '3px 0' }}>₹{(currentLtp - 0.75).toFixed(2)} (2,150)</td>
                <td style={{ color: '#f87171', textAlign: 'right', padding: '3px 0' }}>₹{(currentLtp + 0.75).toFixed(2)} (1,900)</td>
              </tr>
            </tbody>
          </table>

          {/* Quick Order Actions Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: 'auto' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              BUY MARKET
            </div>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              SELL MARKET
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Bottom Positions Strip */}
      <div
        style={{
          background: 'rgba(9, 13, 22, 0.95)',
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>OPEN POSITION:</span>
          <span className="font-mono" style={{ color: '#ffffff', fontWeight: 600 }}>
            {isNifty ? 'NIFTY26SEP25100CE' : 'BANKNIFTY26SEP52200CE'} • 2 LOTS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REAL-TIME P&L:</span>
          <span
            className="font-mono"
            style={{
              fontSize: '0.9rem',
              fontWeight: 800,
              color: pnlValue >= 0 ? '#34d399' : '#f87171',
            }}
          >
            {pnlValue >= 0 ? '+' : ''}₹{pnlValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
