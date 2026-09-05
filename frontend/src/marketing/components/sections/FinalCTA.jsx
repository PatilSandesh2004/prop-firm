import React from 'react';
import { ArrowRight, Terminal } from 'lucide-react';
import Button from '../common/Button';
import { BRAND_CONFIG } from '../../config/navigation';

export default function FinalCTA({ onNavigate }) {
  return (
    <section style={{ padding: '6rem 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="container-max">
        <div
          style={{
            textAlign: 'center',
            maxWidth: '740px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.75rem',
          }}
        >
          <span className="eyebrow">
            START YOUR WORKFLOW
          </span>

          <h2 style={{ fontSize: 'clamp(2.3rem, 4vw, 3.4rem)', fontWeight: 800, lineHeight: 1.1 }}>
            THE MARKET NEVER STOPS TEACHING. <br />
            <span className="gradient-text-emerald">ARE YOU READY TO START?</span>
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '580px' }}>
            Experience an authentic Indian derivatives trading workspace built for discipline and skill refinement.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <Button variant="primary" size="lg" isSimulatorLaunch>
              TRADER ROOM
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                onNavigate('platform');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              EXPLORE THE PLATFORM
            </Button>
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {BRAND_CONFIG.terminalDisclosure}
          </span>
        </div>
      </div>
    </section>
  );
}
