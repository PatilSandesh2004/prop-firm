import React from 'react';
import { IndianRupee, Cpu, Zap, Users, Lock, GitBranch } from 'lucide-react';

export default function TechnologyGrid() {
  const techFeatures = [
    {
      title: 'INDIAN MARKET FOCUS',
      icon: IndianRupee,
      color: '#10b981',
      description:
        'Designed natively around Indian trading realities: index futures, option chain matrices, strike stepping, lot multipliers, and NSE/BSE market trading hours.',
    },
    {
      title: 'PROFESSIONAL TERMINAL',
      icon: Cpu,
      color: '#06b6d4',
      description:
        'Clean, high-efficiency interface engineered for fast market analysis, real-time depth inspection, and instant order placement.',
    },
    {
      title: 'REAL-TIME ARCHITECTURE',
      icon: Zap,
      color: '#38bdf8',
      description:
        'FastAPI async backend paired with in-memory Redis caching for quotes and WebSocket broadcast pipelines for instant P&L updates.',
    },
    {
      title: 'MULTI-USER PLATFORM',
      icon: Users,
      color: '#a855f7',
      description:
        'Scalable architecture supporting independent authenticated trader profiles, individual trade journals, and segregated balance ledgers.',
    },
    {
      title: 'SECURE BY DESIGN',
      icon: Lock,
      color: '#f43f5e',
      description:
        'Strict account-level access controls, JWT token authentication, and isolated private databases ensuring zero state bleeding across traders.',
    },
    {
      title: 'BUILT TO EVOLVE',
      icon: GitBranch,
      color: '#fbbf24',
      description:
        'Modular execution layer with pluggable broker adapter interfaces (Upstox / matching engine) designed to support upcoming live ecosystems.',
    },
  ];

  return (
    <section style={{ padding: '6rem 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="container-max">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 4rem auto' }}>
          <span className="eyebrow" style={{ marginBottom: '1rem' }}>
            ENGINEERING & INFRASTRUCTURE
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 3.2vw, 2.75rem)', fontWeight: 800, marginBottom: '1rem' }}>
            BUILT FOR THE WAY <br />
            <span className="gradient-text-emerald">INDIA TRADES.</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Modern asynchronous engineering tailored for low latency, reliable risk validation, and realistic market depth.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {techFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="glass-card glass-card-interactive"
                style={{
                  padding: '2.25rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} color={feat.color} />
                </div>

                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.65rem', color: '#ffffff' }}>
                    {feat.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
