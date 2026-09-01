import React from 'react';
import { Calendar, Clock, Layers, Hash, TrendingUp, Compass } from 'lucide-react';

export default function IndiaMarketSection() {
  const marketFacts = [
    {
      title: 'CONTRACTS & INDICES',
      icon: Layers,
      value: 'NIFTY, BANKNIFTY, FINNIFTY, SENSEX',
      description: 'Support for benchmark indices and their corresponding futures and strike ladders.',
    },
    {
      title: 'LOT SIZE MECHANICS',
      icon: Hash,
      value: '25 / 15 / 40 / 10 Multipliers',
      description: 'Native Indian derivative lot calculations for margin, quantity, and P&L tracking.',
    },
    {
      title: 'WEEKLY & MONTHLY EXPIRIES',
      icon: Calendar,
      value: 'Tuesday to Thursday Cycles',
      description: 'Calibrated for Indian expiry dynamics, zero-DTE contracts, and strike roll behaviors.',
    },
    {
      title: 'MARKET SESSION HOURS',
      icon: Clock,
      value: '09:15 AM – 03:30 PM IST',
      description: 'Syncs with official Indian cash and derivatives exchange operational sessions.',
    },
  ];

  return (
    <section style={{ padding: '6rem 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="container-max">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr',
            gap: '3.5rem',
            alignItems: 'center',
          }}
          className="india-grid"
        >
          {/* Left Column: Narrative Copy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <span className="eyebrow">
              LOCAL MARKET REALITY
            </span>

            <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3rem)', fontWeight: 800, lineHeight: 1.1 }}>
              BUILT FOR <br />
              <span className="gradient-text-emerald">OUR MARKET.</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>
              <p>
                <strong style={{ color: '#ffffff' }}>Markets are global. But traders trade in local realities.</strong>
              </p>
              <p>
                Contracts. Expiries. Lot sizes. Trading hours. Volatility spikes during opening bells and weekly expiry thursdays.
              </p>
              <p>
                Our technological infrastructure is engineered specifically for Indian market dynamics, giving traders a native environment to master their process.
              </p>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1.25rem',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.5rem',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-emerald-light)' }}>
                Built in India. Built for Serious Indian F&O Traders.
              </span>
            </div>
          </div>

          {/* Right Column: 4 Grid Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.25rem',
            }}
            className="india-facts-grid"
          >
            {marketFacts.map((fact) => {
              const Icon = fact.icon;
              return (
                <div
                  key={fact.title}
                  className="glass-card"
                  style={{
                    padding: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} color="var(--accent-cyan)" />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {fact.title}
                    </span>
                    <h4 className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem' }}>
                      {fact.value}
                    </h4>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 'auto' }}>
                    {fact.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .india-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .india-facts-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
