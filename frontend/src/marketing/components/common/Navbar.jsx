import React, { useState, useEffect } from 'react';
import { Menu, X, Terminal, ChevronRight, Calendar } from 'lucide-react';
import { NAV_LINKS, BRAND_CONFIG } from '../../config/navigation';
import Button from './Button';
import IndicesTickerTape from './IndicesTickerTape';

export default function Navbar({ activePage, onNavigate, onOpenAuth }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [istDateStr, setIstDateStr] = useState('');
  const [istTime, setIstTime] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      // Date formatting for Indian timezone
      const dateOptions = {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      };
      const timeOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setIstDateStr(new Intl.DateTimeFormat('en-IN', dateOptions).format(now));
      setIstTime(new Intl.DateTimeFormat('en-GB', timeOptions).format(now));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLinkClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'all 0.2s ease',
        background: scrolled ? 'rgba(7, 10, 16, 0.96)' : 'rgba(7, 10, 16, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? 'var(--border-medium)' : 'var(--border-subtle)'}`,
      }}
    >
      {/* Top Utility Bar: Today's Day, Date & Live IST Time */}
      <div
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          background: 'rgba(11, 15, 25, 0.85)',
          fontSize: '0.74rem',
          color: 'var(--text-muted)',
          padding: '0.3rem 0',
        }}
      >
        <div
          className="container-max"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-emerald-light)' }}>
              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
              <span style={{ fontWeight: 600 }}>LIVE MARKET SESSION</span>
            </span>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {istDateStr || 'Tuesday, 1 Sep 2026'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="font-mono" style={{ color: '#ffffff', fontWeight: 600 }}>
              IST {istTime || '09:15:00'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>(09:15 – 15:30 IST)</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="container-max" style={{ padding: '0.75rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          
          {/* Brand Logo */}
          <div
            onClick={() => handleLinkClick('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Terminal size={19} color="#07090e" strokeWidth={2.5} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', color: '#ffffff' }}>
                {BRAND_CONFIG.name}
              </span>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent-emerald)' }}>
                {BRAND_CONFIG.suffix}
              </span>
            </div>
          </div>

          {/* Desktop Nav Links (Including Rules) */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            className="nav-desktop-links"
          >
            {NAV_LINKS.map((link) => {
              const isActive = activePage === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleLinkClick(link.id)}
                  style={{
                    background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9rem',
                    padding: '0.5rem 0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Clean LOGIN + TRADER ROOM Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }} className="nav-desktop-actions">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              LOGIN
            </button>

            <Button
              variant="primary"
              size="sm"
              isSimulatorLaunch
            >
              TRADER ROOM
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              padding: '0.45rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'none',
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Horizontal Scrolling 5 Indices Ticker Tape */}
      <IndicesTickerTape />

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => handleLinkClick(link.id)}
              style={{
                background: activePage === link.id ? 'var(--bg-card)' : 'transparent',
                border: '1px solid',
                borderColor: activePage === link.id ? 'var(--border-medium)' : 'transparent',
                borderRadius: 'var(--radius-md)',
                color: activePage === link.id ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.95rem',
                padding: '0.75rem 1rem',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <span>{link.label}</span>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>
          ))}

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.5rem 0' }} />

          <Button
            variant="secondary"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAuth('login');
            }}
          >
            LOGIN / REGISTER
          </Button>

          <Button
            variant="primary"
            isSimulatorLaunch
          >
            TRADER ROOM
          </Button>
        </div>
      )}

      <style>{`
        @media (max-width: 960px) {
          .nav-desktop-links, .nav-desktop-actions, .hidden-mobile {
            display: none !important;
          }
          .mobile-menu-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
