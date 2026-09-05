import React from 'react';
import { CheckCircle2, Clock, Sparkles, Trophy } from 'lucide-react';
import Badge from '../common/Badge';

export default function FutureRoadmap() {
  const phases = [
    {
      status: 'ACTIVE PRODUCT',
      statusVariant: 'live',
      title: 'TRADING TERMINAL',
      subtitle: 'Core Trading Workspace',
      description:
        'Full access to the trading desk environment: real-time Indian index quotes, option chain matrix, order execution workflows, position tracking, and automated risk drawdown checks.',
      items: [
        'NIFTY, BANKNIFTY, FINNIFTY, SENSEX',
        'Top-5 Market Depth & Options Chain',
        'One-Click Market & Limit Orders',
        'Automated Daily Loss / Drawdown Limits',
      ],
    },
    {
      status: 'AVAILABLE NOW',
      statusVariant: 'live',
      title: '1-STEP & 2-STEP CHALLENGES',
      subtitle: 'Structured Evaluation Suite',
      description:
        'Transparent Indian index F&O evaluations with account sizes from ₹1L to ₹10L, 4% max daily loss limit, 2.4% single-loss cap, and 14-day payout cycles.',
      items: [
        '1-Step Challenge (10% Target)',
        '2-Step Challenge (8% + 5% Target)',
        'Intraday Auto Square-Off at 3:14 PM',
        'Scaling Profit Splits: 70% → 80% → 90%',
      ],
    },
    {
      status: 'FUTURE',
      statusVariant: 'cyan',
      title: 'THE COMPLETE ECOSYSTEM',
      subtitle: 'Expanded Infrastructure',
      description:
        'Multi-broker live execution adapters, multi-account trade copier, institutional risk dashboard, and automated payout disbursement pipelines.',
      items: [
        'Expanded Direct Broker Integrations',
        'Community Leaderboards & Analytics',
        'Multi-Account Trade Synchronization',
        'Automated Instant Payout Gateways',
      ],
    },
  ];

  return (
    <section style={{ padding: '6rem 0', background: 'var(--bg-primary)', position: 'relative' }}>
      <div className="container-max">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 4rem auto' }}>
          <span className="eyebrow" style={{ marginBottom: '1rem' }}>
            PRODUCT EVOLUTION
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 3.2vw, 2.75rem)', fontWeight: 800, marginBottom: '1rem' }}>
            THIS IS JUST <br />
            <span className="gradient-text-cyan">THE BEGINNING.</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            A transparent and disciplined product roadmap built to elevate Indian market participants step by step.
          </p>
        </div>

        {/* Roadmap Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}
        >
          {phases.map((phase) => (
            <div
              key={phase.title}
              className="glass-card glass-card-interactive"
              style={{
                padding: '2.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                borderTop: phase.status === 'ACTIVE PRODUCT' || phase.status === 'AVAILABLE NOW' ? '2px solid var(--accent-emerald)' : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge variant={phase.statusVariant}>{phase.status}</Badge>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {phase.subtitle}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                  {phase.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {phase.description}
                </p>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '1.25rem',
                  marginTop: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                {phase.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={15} color={phase.status === 'ACTIVE PRODUCT' || phase.status === 'AVAILABLE NOW' ? '#10b981' : '#06b6d4'} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
