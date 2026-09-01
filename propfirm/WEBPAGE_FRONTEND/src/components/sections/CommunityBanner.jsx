import React from 'react';
import { ShieldCheck, Award, ArrowRight, UserPlus, Compass } from 'lucide-react';
import Button from '../common/Button';
import { TRADING_APP_URL } from '../../config/navigation';

export default function CommunityBanner({ onOpenAuth }) {
  return (
    <section style={{ padding: '5.5rem 0', background: 'var(--bg-primary)', position: 'relative' }}>
      <div className="container-max">
        <div
          className="glass-card"
          style={{
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid var(--border-medium)',
          }}
        >
          <div
            style={{
              maxWidth: '680px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <span className="eyebrow">
              COMMUNITY & VISION
            </span>

            <h2 style={{ fontSize: 'clamp(2rem, 3.2vw, 2.75rem)', fontWeight: 800 }}>
              THE NEXT GENERATION <br />
              <span className="gradient-text-emerald">OF INDIAN TRADERS.</span>
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.65 }}>
              We are building technology and experiences for traders who believe skill, process, and discipline matter. A community anchored in transparency and execution mastery rather than hype.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => onOpenAuth && onOpenAuth('register')}
                icon={UserPlus}
              >
                JOIN THE PLATFORM
              </Button>
              <Button
                variant="secondary"
                size="lg"
                isSimulatorLaunch
              >
                OPEN TRADING SIMULATOR
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
