import React, { useState } from 'react';
import { Target, AlertTriangle, ShieldAlert, Check, TrendingUp, Info, Sparkles } from 'lucide-react';
import Button from '../common/Button';

export default function ChallengeInteractiveLayout({ onOpenAuth }) {
  const [selectedEvaluationType, setSelectedEvaluationType] = useState('1step'); // '1step' | '2step'
  const [selectedAccountSize, setSelectedAccountSize] = useState('1L'); // '1L' | '2L' | '3L' | '5L' | '10L'
  const [activeTabPhase, setActiveTabPhase] = useState('phase1'); // 'phase1' | 'phase2'
  const [activeLeftView, setActiveLeftView] = useState('overview'); // 'overview' | 'funded_rules'

  const sizes = [
    { key: '1L', label: '1L', raw: 100000, display: '₹1,00,000', fee1Step: '₹3,499', fee2Step: '₹2,999' },
    { key: '2L', label: '2L', raw: 200000, display: '₹2,00,000', fee1Step: '₹4,999', fee2Step: '₹3,999' },
    { key: '3L', label: '3L', raw: 300000, display: '₹3,00,000', fee1Step: '₹6,499', fee2Step: '₹5,499' },
    { key: '5L', label: '5L', raw: 500000, display: '₹5,00,000', fee1Step: '₹8,999', fee2Step: '₹7,999', badge: 'Popular' },
    { key: '10L', label: '10L', raw: 1000000, display: '₹10,00,000', fee1Step: '₹13,999', fee2Step: '₹11,999', badge: 'Pro' },
  ];

  const currentSizeObj = sizes.find((s) => s.key === selectedAccountSize) || sizes[0];
  const is1Step = selectedEvaluationType === '1step';
  const fee = is1Step ? currentSizeObj.fee1Step : currentSizeObj.fee2Step;
  const rawBalance = currentSizeObj.raw;

  // Targets calculation
  let targetPct = 0.10;
  let targetDisplay = `${(rawBalance * 0.10).toLocaleString('en-IN')}`;
  let targetSub = '10% of balance';
  let minDays = 6;
  let timeLimit = '30 Days';

  if (!is1Step) {
    if (activeTabPhase === 'phase1') {
      targetPct = 0.08;
      targetDisplay = `${(rawBalance * 0.08).toLocaleString('en-IN')}`;
      targetSub = '8% of balance';
      minDays = 5;
      timeLimit = '30 Days';
    } else {
      targetPct = 0.05;
      targetDisplay = `${(rawBalance * 0.05).toLocaleString('en-IN')}`;
      targetSub = '5% of balance';
      minDays = 5;
      timeLimit = '60 Days';
    }
  }

  const dailyDrawdownDisplay = `${(rawBalance * 0.04).toLocaleString('en-IN')}`;
  const maxDrawdownDisplay = `${(rawBalance * 0.08).toLocaleString('en-IN')}`;
  const max1DayProfitDisplay = `${(rawBalance * targetPct * 0.30).toLocaleString('en-IN')}`;

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. Evaluation Model Switcher (Top Centered) */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(18, 24, 38, 0.95)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.35rem',
            gap: '0.35rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setSelectedEvaluationType('1step');
              setActiveTabPhase('phase1');
            }}
            style={{
              background: is1Step ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: is1Step ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1.85rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: is1Step ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
            }}
          >
            1 Step Evaluation (10%)
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedEvaluationType('2step');
              setActiveTabPhase('phase1');
            }}
            style={{
              background: !is1Step ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' : 'transparent',
              color: !is1Step ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1.85rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: !is1Step ? '0 4px 15px rgba(6, 182, 212, 0.3)' : 'none',
            }}
          >
            2 Step Evaluation (8% + 5%)
          </button>
        </div>
      </div>

      {/* 2. Prominent, Extra-Large Account Size Selector Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(130px, 1fr))',
            gap: '0.75rem',
            width: '100%',
            maxWidth: '920px',
            background: 'rgba(12, 17, 28, 0.95)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            padding: '0.6rem',
          }}
          className="account-size-grid"
        >
          {sizes.map((s) => {
            const isActive = selectedAccountSize === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSelectedAccountSize(s.key)}
                style={{
                  background: isActive
                    ? 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#090d16' : 'var(--text-secondary)',
                  border: isActive
                    ? '2px solid #ffffff'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.9rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.2rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  boxShadow: isActive ? '0 8px 25px rgba(255, 255, 255, 0.2)' : 'none',
                  transform: isActive ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                {s.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-9px',
                      fontSize: '0.65rem',
                      background: s.badge === 'Popular' ? 'var(--accent-emerald)' : '#06b6d4',
                      color: '#000000',
                      padding: '0.12rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                    }}
                  >
                    {s.badge}
                  </span>
                )}

                {/* Big Bold 1L / 2L / 3L / 5L / 10L Text */}
                <span
                  className="font-mono"
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                  }}
                >
                  {s.label}
                </span>

                <span
                  style={{
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    opacity: isActive ? 0.85 : 0.6,
                  }}
                >
                  {s.display}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Split Grid (Left Pricing Card & Right Targets Board) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: '1.5rem',
          alignItems: 'stretch',
        }}
        className="challenge-split-grid"
      >
        {/* Left Pricing Card */}
        <div
          className="glass-card"
          style={{
            borderRadius: 'var(--radius-lg)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            padding: '2rem 1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
            background: 'linear-gradient(180deg, rgba(18, 24, 38, 0.98) 0%, rgba(12, 17, 28, 0.98) 100%)',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 185, 129, 0.12)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {is1Step ? '1-STEP EVALUATION' : '2-STEP EVALUATION'}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
              <span className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff' }}>
                {fee}
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              for a {currentSizeObj.display} account
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              One-time enrollment fee
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Buy Challenge
            </button>

            <button
              type="button"
              onClick={() => setActiveLeftView(activeLeftView === 'overview' ? 'funded_rules' : 'overview')}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {activeLeftView === 'overview' ? 'View Funded Rules' : 'View Account Summary'}
            </button>
          </div>

          {/* Account Spec Rows */}
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '1rem',
              marginTop: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              fontSize: '0.82rem',
            }}
          >
            {activeLeftView === 'overview' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Account Balance</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>
                    {currentSizeObj.display.replace('₹', '')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Profit Split</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    70% → 90%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Min Active Days</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>
                    {minDays} Days
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Evaluation Period</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>
                    {timeLimit}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Payout Cycle</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>
                    Every 14 days
                  </span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Starting Profit Split</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>70/30</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>After 2 Winning Cycles</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>80/20</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>After 3 Winning Cycles</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>90/10</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Min Payout</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>₹4,000</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Board: Evaluation Targets */}
        <div
          className="glass-card"
          style={{
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-medium)',
            padding: '2rem 2.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            background: 'var(--bg-secondary)',
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Evaluation targets
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
                {is1Step
                  ? 'One evaluation phase. Hit the target without breaking the rules and you earn funded status.'
                  : 'Two-phase evaluation. Consistent execution and disciplined risk management earn funded status.'}
              </p>
            </div>

            <div
              style={{
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: 'var(--accent-cyan)',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {currentSizeObj.label} ACCOUNT
            </div>
          </div>

          {/* Phase 1 / Phase 2 selector if 2-Step */}
          {!is1Step && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveTabPhase('phase1')}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: activeTabPhase === 'phase1' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${activeTabPhase === 'phase1' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                  color: activeTabPhase === 'phase1' ? '#22d3ee' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Phase 1 (8% Target)
              </button>
              <button
                type="button"
                onClick={() => setActiveTabPhase('phase2')}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: activeTabPhase === 'phase2' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${activeTabPhase === 'phase2' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                  color: activeTabPhase === 'phase2' ? '#22d3ee' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Phase 2 (5% Target)
              </button>
            </div>
          )}

          {/* 2x2 Target Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
            className="targets-2x2-grid"
          >
            {/* Box 1: Profit Target */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-md)', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                PROFIT TARGET
              </span>
              <div className="font-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#34d399' }}>
                ₹{targetDisplay}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {targetSub}
              </span>
            </div>

            {/* Box 2: Daily Drawdown */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-md)', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                DAILY DRAWDOWN
              </span>
              <div className="font-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f87171' }}>
                ₹{dailyDrawdownDisplay}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                4% max (Single loss ≤ 2.4%)
              </span>
            </div>

            {/* Box 3: Max Drawdown */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-md)', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                MAX DRAWDOWN
              </span>
              <div className="font-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f87171' }}>
                ₹{maxDrawdownDisplay}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                8% of starting balance
              </span>
            </div>

            {/* Box 4: Max 1-Day Profit */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-md)', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                MAX 1-DAY PROFIT
              </span>
              <div className="font-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fbbf24' }}>
                ₹{max1DayProfitDisplay}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                30% consistency rule
              </span>
            </div>
          </div>

          {/* Footnote information note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '1rem',
              marginTop: 'auto',
            }}
          >
            <Info size={15} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              All amounts are calculated on your {currentSizeObj.display} starting balance. Drawdown limits stay the same in every phase — nothing changes once you're funded.
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .challenge-split-grid {
            grid-template-columns: 1fr !important;
          }
          .targets-2x2-grid {
            grid-template-columns: 1fr !important;
          }
          .account-size-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 540px) {
          .account-size-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
