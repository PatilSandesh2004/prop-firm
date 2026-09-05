import React from 'react';
import { Terminal, Shield, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import { BRAND_CONFIG } from '../../config/navigation';

export default function TerminalCTA() {
  return (
    <section style={{ padding: '5rem 0', position: 'relative' }}>
      <div className="container-max">
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(18, 24, 38, 0.95) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '4rem 2.5rem',
            overflow: 'hidden',
            boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.7)',
          }}
        >
          {/* Subtle Ambient Radial Flare */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: '450px',
              height: '450px',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: '720px',
              margin: '0 auto',
              gap: '1.5rem',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div className="eyebrow" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
              <Terminal size={14} />
              <span>DEDICATED TRADING DESK</span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)',
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: '-0.03em',
              }}
            >
              YOUR TRADING DESK, <br />
              <span className="gradient-text-cyan">READY WHEN YOU ARE.</span>
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
              Access the trading environment and explore market instruments, live option chains, fast order routing, and real-time risk controls directly.
            </p>

            {/* Main Action Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', marginTop: '0.5rem' }}>
              <Button variant="primary" size="lg" isSimulatorLaunch>
                TRADER ROOM
              </Button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {BRAND_CONFIG.terminalDisclosure}
              </span>
            </div>

            {/* Feature Checkpoints */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '1.5rem',
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} color="var(--accent-emerald)" />
                Zero setup required
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} color="var(--accent-emerald)" />
                Authentic Indian F&O depth
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} color="var(--accent-emerald)" />
                Isolated private ledger
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
