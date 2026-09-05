import React from 'react';
import { Terminal, LineChart, ShieldCheck, Trophy, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';

export default function PlatformOverview({ onNavigate }) {
  const cards = [
    {
      id: 'terminal',
      title: 'TRADING TERMINAL',
      badge: 'ACTIVE PRODUCT',
      badgeVariant: 'live',
      icon: Terminal,
      iconColor: '#10b981',
      description:
        'Access a high-performance trading workspace built specifically around Indian index futures, options chain matrices, and fast order workflows.',
      features: ['Index Futures & Options', 'Interactive Market Depth', 'Instant One-Click Square Off'],
    },
    {
      id: 'market-data',
      title: 'MARKET INTELLIGENCE',
      badge: 'REAL-TIME DATA',
      badgeVariant: 'cyan',
      icon: LineChart,
      iconColor: '#06b6d4',
      description:
        'Real-time quote streaming via Redis-backed cache layer. Explore strikes, expiries, lot sizes, and candlestick intervals with sub-millisecond precision.',
      features: ['Live Redis In-Memory Quotes', 'Full Greeks & Strike Depth', 'NSE / BSE Indices Coverage'],
    },
    {
      id: 'performance',
      title: 'PERFORMANCE & RISK',
      badge: 'AUTOMATED ENGINE',
      badgeVariant: 'neutral',
      icon: ShieldCheck,
      iconColor: '#38bdf8',
      description:
        'Automated drawdown controls and strict daily loss limits. Monitor realized and unrealized P&L in real-time to build ruthless risk discipline.',
      features: ['Daily Loss Limits (4%)', 'Single-Trade Cap (2.4%)', 'Trade Journal & Audit History'],
    },
    {
      id: 'challenges',
      title: 'TRADER CHALLENGES',
      badge: '1-STEP & 2-STEP',
      badgeVariant: 'live',
      icon: Trophy,
      iconColor: '#f59e0b',
      description:
        'Structured evaluations from ₹1L to ₹10L. Prove your risk discipline, meet the profit targets, and unlock scaling profit splits up to 90%.',
      features: ['1-Step (10% Target)', '2-Step (8% + 5% Target)', '14-Day Payout Cycles'],
    },
  ];

  return (
    <section style={{ padding: '6rem 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="container-max">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 4rem auto' }}>
          <span className="eyebrow" style={{ marginBottom: '1rem' }}>
            PRODUCT ECOSYSTEM
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 3.2vw, 2.75rem)', fontWeight: 800, marginBottom: '1rem' }}>
            ONE ECOSYSTEM. <br />
            <span className="gradient-text-emerald">BUILT FOR TRADERS.</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Every component in our platform is engineered around the unique dynamics of the Indian derivatives market.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="glass-card glass-card-interactive"
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  position: 'relative',
                  cursor: card.id === 'challenges' ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (card.id === 'challenges') {
                    onNavigate('challenges');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={22} color={card.iconColor} />
                  </div>
                  <Badge variant={card.badgeVariant}>{card.badge}</Badge>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>
                    {card.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {card.description}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingTop: '1rem',
                    marginTop: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {card.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: card.iconColor }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
