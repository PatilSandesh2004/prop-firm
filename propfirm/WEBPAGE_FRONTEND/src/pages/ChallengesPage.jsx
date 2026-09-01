import React from 'react';
import { Layers, Clock, Zap, Wallet, ShieldAlert, Target, Percent } from 'lucide-react';
import Button from '../components/common/Button';
import ChallengeInteractiveLayout from '../components/challenges/ChallengeInteractiveLayout';

export default function ChallengesPage({ onOpenAuth }) {
  return (
    <div className="animate-fade-in" style={{ padding: '3.5rem 0 6rem 0' }}>
      <div className="container-max">
        {/* Page Hero Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 2.5rem auto' }}>
          <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald-light)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            INDIAN INDEX F&O PROGRAM
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.6rem)', fontWeight: 800, marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
            TRADE DISCIPLINE. <br />
            <span className="gradient-text-emerald">EARN CAPITAL ACCESS.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Structured evaluations tailored strictly for Indian index derivatives. Pass the risk benchmark, prove consistency, and unlock profit-sharing accounts up to 90%.
          </p>

          {/* Clean Metric Strip */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1.5rem',
              marginTop: '1.25rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '0.75rem 0',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={15} color="var(--accent-emerald)" />
              <strong>NIFTY • BANKNIFTY • FINNIFTY • MIDCPNIFTY • SENSEX</strong>
            </span>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={15} color="var(--accent-cyan)" />
              <strong>Intraday (3:14 PM Auto Square-Off)</strong>
            </span>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={15} color="var(--accent-amber)" />
              <strong>News Trading Allowed</strong>
            </span>
          </div>
        </div>

        {/* Screenshot-Matching Interactive Challenge Desk */}
        <ChallengeInteractiveLayout onOpenAuth={onOpenAuth} />

        {/* Point-by-Point Core Rules Grid */}
        <div style={{ marginTop: '4.5rem', marginBottom: '3rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2rem auto' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
              EVALUATION RULES OVERVIEW
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
              Clear, transparent boundaries to protect your capital and prove repeatable execution.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {[
              {
                num: '01',
                title: 'Profit Target',
                desc: 'Achieve 10% for 1-Step, or 8% (Phase 1) & 5% (Phase 2) for 2-Step within the allotted evaluation period.',
              },
              {
                num: '02',
                title: '4% Max Daily Drawdown',
                desc: 'Net daily loss cannot exceed 4% of starting balance. Single-trade loss is capped at 2.4% (60% of daily max).',
              },
              {
                num: '03',
                title: '8% Max Overall Drawdown',
                desc: 'Cumulative loss from starting balance cannot exceed 8% at any point during the evaluation.',
              },
              {
                num: '04',
                title: 'Minimum 5–6 Active Days',
                desc: 'Log trades across at least 6 distinct trading days (1-Step) or 5 days per phase (2-Step) to demonstrate consistency.',
              },
              {
                num: '05',
                title: '30% Profit Consistency Cap',
                desc: 'No single day may account for more than 30% of your total profit target, preventing lucky one-shot passes.',
              },
              {
                num: '06',
                title: '14-Day Payout Cycles',
                desc: 'Funded accounts process withdrawals every 14 days with profit splits scaling from 70% up to 90%.',
              },
            ].map((r) => (
              <div
                key={r.num}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <span className="font-mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  RULE #{r.num}
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                  {r.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Button variant="primary" size="lg" isSimulatorLaunch>
            TRADER ROOM
          </Button>
        </div>
      </div>
    </div>
  );
}
