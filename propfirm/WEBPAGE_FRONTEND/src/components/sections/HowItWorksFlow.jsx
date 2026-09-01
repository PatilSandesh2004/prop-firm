import React from 'react';
import { UserPlus, Compass, Target, TrendingUp, ChevronRight } from 'lucide-react';

export default function HowItWorksFlow() {
  const steps = [
    {
      num: '01',
      title: 'CREATE YOUR ACCOUNT',
      icon: UserPlus,
      description: 'Join the ecosystem with email authentication to establish your unique trader profile and secure ledger.',
    },
    {
      num: '02',
      title: 'EXPLORE THE PLATFORM',
      icon: Compass,
      description: 'Launch the trading desk to access real-time market depth, option chains, and order execution tools.',
    },
    {
      num: '03',
      title: 'BUILD YOUR PROCESS',
      icon: Target,
      description: 'Test strategies, track drawdown boundaries, and build disciplined execution workflows in Indian market conditions.',
    },
    {
      num: '04',
      title: 'GROW WITH THE ECOSYSTEM',
      icon: TrendingUp,
      description: 'Access upcoming structured trader programs, performance challenges, and expanded analytical tooling as they roll out.',
    },
  ];

  return (
    <section style={{ padding: '6rem 0', background: 'var(--bg-primary)', position: 'relative' }}>
      <div className="container-max">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 4rem auto' }}>
          <span className="eyebrow" style={{ marginBottom: '1rem' }}>
            ONBOARDING & WORKFLOW
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 3.2vw, 2.75rem)', fontWeight: 800, marginBottom: '1rem' }}>
            YOUR JOURNEY <br />
            <span className="gradient-text-cyan">STARTS HERE.</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            A structured path designed to focus on what truly matters: trading discipline, risk management, and execution mastery.
          </p>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            position: 'relative',
          }}
        >
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="glass-card glass-card-interactive"
                style={{
                  padding: '2rem 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  position: 'relative',
                }}
              >
                {/* Step Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      color: 'rgba(255, 255, 255, 0.18)',
                      letterSpacing: '-0.05em',
                    }}
                  >
                    {step.num}
                  </span>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} color="var(--accent-cyan)" />
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.6rem', color: '#ffffff' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {step.description}
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
