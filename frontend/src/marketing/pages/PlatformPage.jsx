import React, { useState } from 'react';
import { Terminal, Layers, Sliders, Shield, Zap, RefreshCw, BarChart2, Check, ArrowRight } from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function PlatformPage() {
  const [activeTab, setActiveTab] = useState('terminal');

  const capabilities = [
    {
      id: 'terminal',
      title: 'TRADING TERMINAL',
      subtitle: 'Execution Desk',
      description:
        'A streamlined trading terminal crafted for Indian derivatives traders. Instant multi-asset watchlist monitoring, live top-5 market depth, and one-click order actions.',
      highlights: [
        'Multi-asset streaming watchlist (NIFTY, BANKNIFTY, FINNIFTY, SENSEX)',
        'Top-5 Bid & Ask market depth with volume profiling',
        'One-click instant buy/sell and full portfolio square off',
        'Sub-millisecond state synchronization across components',
      ],
    },
    {
      id: 'options',
      title: 'OPTION DATA & CHAIN',
      subtitle: 'Derivatives Matrix',
      description:
        'A comprehensive options chain with full strike ladders, ATM straddle calculations, weekly and monthly expiry selectors, and automatic lot sizing.',
      highlights: [
        'Unified Call (CE) & Put (PE) strike matrix with ATM highlighting',
        'Support for Tuesday, Wednesday, and Thursday Indian expiry cycles',
        'Integrated order ticket pre-filled with strike, lot multiplier & side',
        'Real-time price freshness indicators and bid-ask spreads',
      ],
    },
    {
      id: 'orders',
      title: 'ORDER WORKFLOW',
      subtitle: 'Execution Routing',
      description:
        'Support for Market and Limit order routing with automated margin utilization calculations, lot sizing validations, and instant order book status updates.',
      highlights: [
        'Automatic lot size multipliers (e.g. 25 for NIFTY, 15 for BANKNIFTY)',
        'Pre-trade margin calculation and balance adequacy verification',
        'Pending order cancellation and live order execution audit logs',
        'Deterministic order matching with realistic queue fills',
      ],
    },
    {
      id: 'risk',
      title: 'RISK & DRAWDOWN ENGINE',
      subtitle: 'Discipline Telemetry',
      description:
        'Built-in server-side risk manager actively evaluating every trade against max daily loss and overall account drawdown thresholds.',
      highlights: [
        'Real-time automated Max Daily Loss limit enforcement',
        'Trailing and absolute Max Drawdown protection algorithms',
        'Instant live equity and utilized margin recalculation',
        'Account state preservation across trading sessions',
      ],
    },
  ];

  const currentCap = capabilities.find((c) => c.id === activeTab) || capabilities[0];

  return (
    <div className="animate-fade-in" style={{ padding: '4rem 0 6rem 0' }}>
      <div className="container-max">
        {/* Page Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 4rem auto' }}>
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>
            TECHNOLOGY SPECIFICATION
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.5rem)', fontWeight: 800, marginBottom: '1.25rem' }}>
            THE TRADING <br />
            <span className="gradient-text-emerald">PLATFORM ARCHITECTURE.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Explore the high-frequency trading workspace, market depth engine, and automated risk systems built for the Indian market.
          </p>

          <div style={{ marginTop: '2rem' }}>
            <Button variant="primary" size="lg" isSimulatorLaunch>
              OPEN TRADING SIMULATOR
            </Button>
          </div>
        </div>

        {/* Feature Interactive Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '3rem',
          }}
        >
          {capabilities.map((cap) => {
            const isActive = activeTab === cap.id;
            return (
              <button
                key={cap.id}
                type="button"
                onClick={() => setActiveTab(cap.id)}
                style={{
                  background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                  border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                  color: isActive ? '#34d399' : 'var(--text-secondary)',
                  padding: '0.75rem 1.4rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {cap.title}
              </button>
            );
          })}
        </div>

        {/* Active Feature Display Card */}
        <div
          className="glass-card"
          style={{
            padding: '3.5rem 3rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-medium)',
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: '3.5rem',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <span className="eyebrow" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                {currentCap.subtitle}
              </span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginTop: '0.5rem' }}>
                {currentCap.title}
              </h2>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>
              {currentCap.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {currentCap.highlights.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '2px',
                      flexShrink: 0,
                    }}
                  >
                    <Check size={12} color="#34d399" />
                  </div>
                  <span style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 500 }}>
                    {h}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <Button variant="primary" isSimulatorLaunch>
                OPEN TRADING SIMULATOR
              </Button>
            </div>
          </div>

          {/* Feature Visual Preview Card */}
          <div
            style={{
              background: '#0a0e19',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
              <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                SYSTEM STATE: ONLINE
              </span>
              <Badge variant="live">LIVE ENGINE</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Underlying Engine:</span>
                <span className="font-mono" style={{ color: '#ffffff' }}>FastAPI + Asyncpg + Redis</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Latency Target:</span>
                <span className="font-mono" style={{ color: '#34d399' }}>&lt; 5ms Internal In-Memory</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Order Sizing Mode:</span>
                <span className="font-mono" style={{ color: '#ffffff' }}>Native Lot Multipliers</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Environment:</span>
                <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>Simulated Practice Matching</span>
              </div>
            </div>

            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              The current trading terminal executes orders against simulated market depth derived from real-time pricing models. Live broker execution connectors are in active architectural development.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
