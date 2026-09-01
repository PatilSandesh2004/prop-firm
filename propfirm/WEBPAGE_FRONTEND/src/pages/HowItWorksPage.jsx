import React from 'react';
import { UserCheck, Key, Terminal, Compass, BarChart, ShieldCheck, ArrowRight } from 'lucide-react';
import Button from '../components/common/Button';
import { BRAND_CONFIG } from '../config/navigation';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'CREATE ACCOUNT',
      icon: UserCheck,
      desc: 'Sign up with your email credentials to establish your unique trader profile and segregated ledger database.',
    },
    {
      num: '02',
      title: 'ACCESS THE PLATFORM',
      icon: Key,
      desc: 'Log in to securely authenticate your session and initialize your account balance and risk parameters.',
    },
    {
      num: '03',
      title: 'OPEN TRADING SIMULATOR',
      icon: Terminal,
      desc: 'Launch the dedicated trading terminal in a separate workspace to access live Indian index quotes and depth.',
    },
    {
      num: '04',
      title: 'EXPLORE MARKET TOOLS',
      icon: Compass,
      desc: 'Navigate multi-asset watchlists, view option chain matrices (CE/PE), and execute market or limit orders with native lot sizing.',
    },
    {
      num: '05',
      title: 'TRACK ACTIVITY & RISK',
      icon: BarChart,
      desc: 'Monitor real-time unrealized P&L, square off positions instantly, and develop strict discipline against daily loss limits.',
    },
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '4rem 0 6rem 0' }}>
      <div className="container-max">
        {/* Page Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 4rem auto' }}>
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>
            OPERATIONAL WORKFLOW
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.5rem)', fontWeight: 800, marginBottom: '1.25rem' }}>
            HOW THE <br />
            <span className="gradient-text-cyan">ECOSYSTEM OPERATES.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            A transparent, discipline-focused pathway designed to help Indian traders understand and refine their execution process.
          </p>

          <div style={{ marginTop: '2rem' }}>
            <Button variant="primary" size="lg" isSimulatorLaunch>
              OPEN TRADING SIMULATOR
            </Button>
          </div>
        </div>

        {/* Vertical Stepper Cards */}
        <div
          style={{
            maxWidth: '850px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="glass-card glass-card-interactive"
                style={{
                  padding: '2rem 2.5rem',
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={24} color="var(--accent-emerald)" />
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                    {s.num}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
                    {s.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Honest Disclosure Box */}
        <div
          style={{
            maxWidth: '850px',
            margin: '3.5rem auto 0 auto',
            padding: '1.75rem 2rem',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(18, 24, 38, 0.8)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <ShieldCheck size={28} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: '#ffffff' }}>Execution Disclosure: </strong>
            The currently available trading terminal runs on a simulation matching engine against real-time pricing feeds. This allows market participants to practice strategy sizing, order entry, and drawdown discipline in authentic Indian F&O conditions without capital risk.
          </div>
        </div>
      </div>
    </div>
  );
}
