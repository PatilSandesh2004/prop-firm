import React from 'react';
import { Target, Shield, Cpu, Award, Zap, Terminal, ArrowRight } from 'lucide-react';
import Button from '../components/common/Button';
import { BRAND_CONFIG } from '../config/navigation';

export default function AboutPage() {
  const principles = [
    {
      num: '01',
      title: 'SKILL BEFORE CAPITAL',
      desc: 'Capital without process is merely speculation. We believe true long-term edge in trading comes from consistent execution and risk discipline.',
    },
    {
      num: '02',
      title: 'BUILT FOR THE INDIAN MARKET',
      desc: 'Indian derivatives have distinct mechanics: weekly expiries, dynamic lot sizes, strike stepping, and local market hours. Our stack is native to these realities.',
    },
    {
      num: '03',
      title: 'DISCIPLINE IS THE REAL EDGE',
      desc: 'Risk controls should not be an afterthought. Automated daily loss checks and drawdown thresholds protect traders from catastrophic emotional errors.',
    },
    {
      num: '04',
      title: 'ENGINEERING TRANSPARENCY',
      desc: 'We prioritize honest communication, realistic order execution models, and compliance readiness over misleading marketing gimmicks.',
    },
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '4rem 0 6rem 0' }}>
      <div className="container-max">
        {/* Page Header */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 4rem auto' }}>
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>
            MISSION & PHILOSOPHY
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.6rem)', fontWeight: 800, marginBottom: '1.25rem' }}>
            FOR TRADERS WHO <br />
            <span className="gradient-text-emerald">DEMAND MORE FROM THE PROCESS.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.7 }}>
            We are building modern technology and platform experiences for the next generation of disciplined Indian traders.
          </p>
        </div>

        {/* Story Section */}
        <div
          className="glass-card"
          style={{
            maxWidth: '900px',
            margin: '0 auto 4rem auto',
            padding: '3.5rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
            lineHeight: 1.8,
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
          }}
        >
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Why We Are Building This Ecosystem
          </h2>
          <p>
            The Indian financial markets have witnessed unprecedented growth in derivative participation. Millions of traders navigate NIFTY, BANKNIFTY, and equity options every single day. Yet, the ecosystem has historically lacked tools dedicated to developing <strong style={{ color: '#ffffff' }}>ruthless risk discipline</strong> and systematic process before capital is put at risk.
          </p>
          <p>
            We set out to engineer a technology foundation that treats trading as a serious professional craft. By combining low-latency asynchronous architecture, realistic Indian options depth, and automated server-side drawdown boundaries, we empower traders to focus on execution quality.
          </p>
          <p>
            Our roadmap represents a long-term commitment to building transparent, compliant, and performance-centric trading tools for the Indian financial ecosystem.
          </p>
        </div>

        {/* 4 Guiding Principles */}
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '2rem', textAlign: 'center' }}>
            Our Guiding Principles
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {principles.map((p) => (
              <div
                key={p.num}
                className="glass-card"
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  PRINCIPLE // {p.num}
                </span>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                  {p.title}
                </h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Action */}
        <div style={{ textAlign: 'center', marginTop: '5rem' }}>
          <Button variant="primary" size="lg" isSimulatorLaunch>
            OPEN TRADING SIMULATOR
          </Button>
        </div>
      </div>
    </div>
  );
}
