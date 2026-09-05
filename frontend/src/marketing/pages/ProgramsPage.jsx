import React, { useState } from 'react';
import { Sparkles, Bell, Shield, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function ProgramsPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  const plannedPillars = [
    {
      title: 'Skill-Based Evaluation Benchmarks',
      desc: 'Structured trading objectives focused on consistency, risk management, and maximum loss discipline.',
    },
    {
      title: 'Transparent Rule Architecture',
      desc: 'Clear, unambiguous drawdown parameters with zero hidden clauses or deceptive time limits.',
    },
    {
      title: 'Indian Market Calibration',
      desc: 'Tailored specifically for Indian index derivatives trading with realistic lot sizing and liquidity.',
    },
    {
      title: 'Regulatory & Compliance Focus',
      desc: 'Built with rigorous adherence to Indian legal and regulatory guidelines before public rollout.',
    },
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '4rem 0 6rem 0' }}>
      <div className="container-max">
        {/* Page Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 4rem auto' }}>
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>
            <span className="pulse-dot" style={{ background: '#f59e0b' }} />
            <span>COMING SOON</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.5rem)', fontWeight: 800, marginBottom: '1.25rem' }}>
            THE NEXT CHAPTER <br />
            <span className="gradient-text-emerald">IS BEING BUILT.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.65 }}>
            We're building new structured experiences for serious traders who value discipline and consistency above all else.
          </p>
        </div>

        {/* Coming Soon Showcase Card */}
        <div
          className="glass-card"
          style={{
            maxWidth: '850px',
            margin: '0 auto',
            padding: '3.5rem 3rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                INITIATIVE STATUS
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginTop: '0.25rem' }}>
                Structured Trader Programs
              </h2>
            </div>
            <Badge variant="coming" icon={Sparkles}>
              UNDER ARCHITECTURAL REVIEW
            </Badge>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>
            We are designing institutional-grade performance evaluations tailored for Indian retail market participants. We strictly avoid misleading marketing claims, fabricated profit statistics, or unregulated payout promises. Programs will be launched only after comprehensive legal, compliance, and infrastructure readiness.
          </p>

          {/* Planned Pillars Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {plannedPillars.map((p, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                    {p.title}
                  </h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Notification Form */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
              Be the first to know when programs launch
            </h3>

            {submitted ? (
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                ✓ Thank you for registering your interest! We will notify you upon launch.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    flex: '1 1 280px',
                    padding: '0.85rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-medium)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
                <Button type="submit" variant="primary" icon={Bell}>
                  NOTIFY ME AT LAUNCH
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Current Available Action */}
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            In the meantime, you can explore the active trading terminal today:
          </p>
          <Button variant="secondary" size="lg" isSimulatorLaunch>
            OPEN TRADING SIMULATOR
          </Button>
        </div>
      </div>
    </div>
  );
}
