import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Shield, ArrowRight } from 'lucide-react';
import Button from '../components/common/Button';
import { BRAND_CONFIG } from '../config/navigation';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      category: 'Ecosystem & Brand',
      q: 'What is the vision of this trading ecosystem?',
      a: 'We are creating a modern Indian trading ecosystem focused on performance, discipline, technology, and trader growth. Our platform provides serious market participants with the infrastructure, tools, and risk frameworks necessary to master their process in Indian derivatives.',
    },
    {
      category: 'Trading Terminal & Technology',
      q: 'How does the trading terminal work?',
      a: 'The trading terminal operates as a dedicated high-performance workspace. It streams quotes via an in-memory Redis cache and provides interactive charts, live option chains with Call/Put strikes, fast order entry tickets (Market and Limit), and automatic risk checks (daily loss and drawdown limits).',
    },
    {
      category: 'Simulation Disclosure',
      q: 'Is the current trading terminal a live or simulated environment?',
      a: 'The currently available trading product operates in a simulated environment using deterministic order matching and live pricing streams. This allows traders to practice execution workflows and validate risk discipline without risking real capital. Live broker execution connectors are in architectural development.',
    },
    {
      category: 'Market Focus & Instruments',
      q: 'Which Indian instruments are supported?',
      a: 'The platform supports major benchmark indices including NIFTY 50, BANKNIFTY, FINNIFTY, SENSEX, and MIDCAPNIFTY. Traders can access index futures and options with weekly and monthly expiries, native lot sizes, and strike intervals.',
    },
    {
      category: 'Risk Management',
      q: 'How do automated risk controls function?',
      a: 'The system runs automated server-side risk telemetry on every trade. If an account breaches predefined daily loss thresholds or maximum overall drawdown limits, the risk engine automatically halts further orders to instill strict discipline.',
    },
    {
      category: 'Trader Programs & Future Roadmap',
      q: 'When will structured evaluation programs become available?',
      a: 'Structured trader programs are currently under active architectural and compliance review ("Coming Soon"). We are committed to launching only verified, transparent, and legally compliant programs. You can register your email on the Programs page to receive launch notifications.',
    },
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '4rem 0 6rem 0' }}>
      <div className="container-max">
        {/* Page Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 4rem auto' }}>
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.5rem)', fontWeight: 800, marginBottom: '1.25rem' }}>
            TRANSPARENT ANSWERS <br />
            <span className="gradient-text-emerald">ABOUT OUR PLATFORM.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Everything you need to know about the ecosystem, the trading terminal, risk mechanics, and upcoming initiatives.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div
          style={{
            maxWidth: '850px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="glass-card"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  border: isOpen ? '1px solid var(--border-medium)' : '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  style={{
                    width: '100%',
                    padding: '1.5rem 2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isOpen ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    color: '#ffffff',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                      {faq.category}
                    </span>
                    <span>{faq.q}</span>
                  </div>
                  {isOpen ? <ChevronUp size={20} color="var(--accent-emerald)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 2rem 1.75rem 2rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                      borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                      paddingTop: '1.25rem',
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Box */}
        <div
          style={{
            maxWidth: '850px',
            margin: '4rem auto 0 auto',
            textAlign: 'center',
            padding: '3rem 2rem',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
            Ready to explore the trading environment?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Launch the terminal to experience Indian index derivatives depth and order execution tools.
          </p>
          <Button variant="primary" isSimulatorLaunch size="lg">
            OPEN TRADING SIMULATOR
          </Button>
        </div>
      </div>
    </div>
  );
}
