import React from 'react';
import HeroSection from '../components/hero/HeroSection';
import Button from '../components/common/Button';
import ChallengeInteractiveLayout from '../components/challenges/ChallengeInteractiveLayout';

export default function HomePage({ onNavigate, onOpenAuth }) {
  return (
    <main className="animate-fade-in">
      {/* 1. HERO SECTION */}
      <HeroSection onNavigate={onNavigate} onOpenAuth={onOpenAuth} />

      {/* 2. CHALLENGES ON SCROLL (Exact reference layout matching) */}
      <section style={{ padding: '5rem 0 6rem 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }} id="challenges-section">
        <div className="container-max">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3rem auto' }}>
            <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald-light)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              F&O TRADING EVALUATIONS
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              SELECT YOUR <span className="gradient-text-emerald">CHALLENGE.</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '0.5rem' }}>
              Prove consistency on Indian index futures & options. Hit the profit target without breaching daily or overall drawdown boundaries.
            </p>
          </div>

          {/* Screenshot-Matching Interactive Challenge Desk */}
          <ChallengeInteractiveLayout onOpenAuth={onOpenAuth} />
        </div>
      </section>

      {/* 3. CLEAN FINAL CTA */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-primary)', textAlign: 'center' }}>
        <div className="container-max" style={{ maxWidth: '640px' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, marginBottom: '1rem' }}>
            READY TO TRADE WITH <br />
            <span className="gradient-text-emerald">INSTITUTIONAL DISCIPLINE?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '2rem' }}>
            Access the dedicated trader room to explore Indian index F&O depth, order workflows, and real-time PnL.
          </p>
          <Button variant="primary" size="lg" isSimulatorLaunch>
            TRADER ROOM
          </Button>
        </div>
      </section>
    </main>
  );
}
