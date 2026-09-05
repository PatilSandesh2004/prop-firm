import React from 'react';
import { ArrowRight, ShieldCheck, Zap, BarChart3, ArrowUpRight } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/navigation';
import Button from '../common/Button';
import LivePreviewDesk from './LivePreviewDesk';

export default function HeroSection({ onNavigate, onOpenAuth }) {
  return (
    <section
      style={{
        position: 'relative',
        paddingTop: '3.5rem',
        paddingBottom: '5rem',
        overflow: 'hidden',
      }}
      className="bg-grid-pattern bg-radial-glow"
    >
      <div className="container-max">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: '3.5rem',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          {/* Left Column: Core Brand Messaging */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-emerald-light)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '1.25rem',
                }}
              >
                <span className="pulse-dot" />
                <span>{BRAND_CONFIG.heroEyebrow}</span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2.3rem, 4.2vw, 3.8rem)',
                  lineHeight: 1.08,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  marginBottom: '1.25rem',
                }}
              >
                BUILT FOR THOSE <br />
                <span className="gradient-text-emerald">WHO TAKE TRADING</span> <br />
                SERIOUSLY.
              </h1>

              <p
                style={{
                  fontSize: 'clamp(1rem, 1.25vw, 1.15rem)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  maxWidth: '540px',
                }}
              >
                {BRAND_CONFIG.heroSubheadline}
              </p>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <Button variant="primary" size="lg" isSimulatorLaunch>
                TRADER ROOM
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  const elem = document.getElementById('challenges-section');
                  if (elem) {
                    elem.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    onNavigate('challenges');
                  }
                }}
              >
                EXPLORE CHALLENGES
              </Button>
            </div>

            {/* Key Pillars */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
              className="hero-pillars"
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff', fontWeight: 700, fontSize: '0.92rem' }}>
                  <Zap size={15} color="var(--accent-emerald)" />
                  <span>Real-Time F&O</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>NIFTY & BANKNIFTY</span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff', fontWeight: 700, fontSize: '0.92rem' }}>
                  <ShieldCheck size={15} color="var(--accent-cyan)" />
                  <span>4% Daily Cap</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>2.4% Single Trade</span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff', fontWeight: 700, fontSize: '0.92rem' }}>
                  <BarChart3 size={15} color="var(--accent-emerald-light)" />
                  <span>Up to 90% Split</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>14-Day Payouts</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Desk */}
          <div style={{ position: 'relative' }}>
            <LivePreviewDesk />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .hero-pillars {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>
    </section>
  );
}
