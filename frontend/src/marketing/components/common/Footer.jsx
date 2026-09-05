import React from 'react';
import { Terminal, Shield, ArrowUpRight } from 'lucide-react';
import { BRAND_CONFIG, NAV_LINKS } from '../../config/navigation';

export default function Footer({ onNavigate }) {
  return (
    <footer
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '3.5rem',
        paddingBottom: '2.5rem',
        marginTop: '4rem',
      }}
    >
      <div className="container-max">
        {/* Clean 3-Column Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr',
            gap: '3rem',
            paddingBottom: '2.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
          className="footer-grid"
        >
          {/* Column 1: Brand & Mission */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Terminal size={17} color="#07090e" strokeWidth={2.5} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ffffff' }}>
                {BRAND_CONFIG.name}
                <span style={{ color: 'var(--accent-emerald)' }}>{BRAND_CONFIG.suffix}</span>
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '380px' }}>
              A modern trading ecosystem engineered for Indian index derivatives. Built around performance, discipline, and technology.
            </p>

            <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald-light)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              SKILL BEFORE CAPITAL
            </span>
          </div>

          {/* Column 2: Platform Navigation */}
          <div>
            <h4 style={{ fontSize: '0.82rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
              Navigation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(link.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal & Regulatory */}
          <div>
            <h4 style={{ fontSize: '0.82rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
              Legal & Risk
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li>Challenge Agreement</li>
              <li>F&O Risk Disclaimer</li>
              <li>Regulatory Compliance</li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclosures & Copyright */}
        <div style={{ paddingTop: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', lineHeight: 1.55 }}>
            <strong>Risk Notice: </strong>Derivative trading involves substantial risk of loss and is not suitable for every investor. Trading evaluations are designed to benchmark risk discipline and strategy consistency. The platform does not offer investment advice or guarantee financial outcomes.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid rgba(255, 255, 255, 0.04)',
              paddingTop: '1rem',
            }}
          >
            <div>
              © {new Date().getFullYear()} {BRAND_CONFIG.name}{BRAND_CONFIG.suffix}. Built for Indian Traders.
            </div>
            <div className="font-mono" style={{ color: 'var(--text-dim)' }}>
              NSE / BSE MARKET CALIBRATED
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </footer>
  );
}
