import React, { useState } from 'react';
import {
  Layers,
  Clock,
  Zap,
  Target,
  ShieldAlert,
  Calendar,
  Percent,
  Wallet,
  TrendingUp,
  Lock,
  RefreshCw,
  Cpu,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  FileText,
  HelpCircle,
  Award,
  ChevronRight,
  Search,
} from 'lucide-react';
import Button from '../components/common/Button';

export default function RulesPage({ onOpenAuth }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'SCOPE' | 'EVALUATION' | 'RISK' | 'FUNDED' | 'PAYOUT' | 'SYSTEM'

  const fullRulebook = [
    // 1. PRODUCT SCOPE
    {
      id: 'rule-01',
      category: 'SCOPE',
      section: '1. Product Scope & Permitted Instruments',
      title: 'Permitted Instruments (Indian F&O Only)',
      points: [
        'Trading is permitted exclusively on Indian Index Futures and Options contracts: NIFTY 50, BANKNIFTY, FINNIFTY, MIDCPNIFTY, and SENSEX.',
        'Equity cash segment, commodity derivatives, and currency pairs are strictly prohibited.',
        'Both buying and selling of Options (CE / PE) and Futures are supported.',
      ],
      tag: 'INSTRUMENT RULES',
    },
    {
      id: 'rule-02',
      category: 'SCOPE',
      section: '1. Product Scope & Trading Style',
      title: 'Intraday Only & 3:14 PM Auto Square-Off',
      points: [
        'All trading is strictly Intraday. No BTST (Buy Today, Sell Tomorrow) or STBT (Sell Today, Buy Tomorrow).',
        'No overnight positions may be carried forward under any circumstances.',
        'Every open position must be squared off by 3:14 PM IST.',
        'Any position still open at 3:14 PM IST is automatically force-closed by the risk engine at available market depth/LTP.',
        'Forced 3:14 PM square-offs are treated as normal trades for P&L, trading-day count, single-loss cap, and consistency calculations.',
      ],
      tag: 'EXECUTION POLICY',
    },
    {
      id: 'rule-03',
      category: 'SCOPE',
      section: '1. Product Scope & Market Events',
      title: 'News & Event Trading (100% Allowed)',
      points: [
        'News trading is fully allowed across all evaluation and funded phases.',
        'There are zero restrictions or trading halts around high-impact scheduled events, including RBI Monetary Policy announcements, Union Budget, CPI/IIP releases, and weekly/monthly index expiries.',
        'Profits earned during high-volatility news events are 100% valid and eligible for evaluation targets and payouts.',
      ],
      tag: 'EVENT POLICY',
    },

    // 2. ACCOUNT SIZES & PRICING
    {
      id: 'rule-04',
      category: 'EVALUATION',
      section: '2. Account Sizes and Pricing',
      title: 'Locked Challenge Pricing & Sizing',
      points: [
        '1-Step Challenge Pricing: ₹1,00,000 (₹3,499) • ₹2,00,000 (₹4,999) • ₹3,00,000 (₹6,499) • ₹5,00,000 (₹8,999 - Most Popular) • ₹10,00,000 (₹13,999 - Pro).',
        '2-Step Challenge Pricing: ₹1,00,000 (₹2,999) • ₹2,00,000 (₹3,999) • ₹3,00,000 (₹5,499) • ₹5,00,000 (₹7,999 - Most Popular) • ₹10,00,000 (₹11,999 - Pro).',
        'Important: Account sizes represent starting evaluation balances and virtual trading capital. They are NOT leverage multipliers.',
      ],
      tag: 'PRICING & SIZES',
    },

    // 3. 1-STEP CHALLENGE RULES
    {
      id: 'rule-05',
      category: 'EVALUATION',
      section: '3. 1-Step Challenge Rules',
      title: '1-Step Evaluation Criteria',
      points: [
        'Profit Target: 10% of starting account balance (e.g. ₹50,000 on a ₹5L account).',
        'Maximum Daily Drawdown: 4% of starting balance (e.g. ₹20,000 on ₹5L). Single-loss cap: 2.4% (₹12,000 on ₹5L).',
        'Maximum Overall Drawdown: 8% of starting balance (e.g. ₹40,000 on ₹5L).',
        'Minimum Trading Days: 6 distinct trading days with at least one filled trade.',
        'Time Limit: 30 Calendar Days from account activation date.',
        'Profit Consistency: Highest profitable day must be <= 30% of total positive profit.',
        'All conditions must be fully satisfied before the account transitions to ELIGIBLE_FOR_REVIEW.',
      ],
      tag: '1-STEP MODEL',
    },

    // 4. 2-STEP CHALLENGE RULES
    {
      id: 'rule-06',
      category: 'EVALUATION',
      section: '4. 2-Step Challenge Rules',
      title: '2-Step Evaluation Criteria (Phase 1 & Phase 2)',
      points: [
        'Phase 1 Requirements: 8% Profit Target, 4% Daily Drawdown (2.4% single-loss cap), 8% Overall Drawdown, 5 Minimum Trading Days, 30 Calendar Days time limit, <= 30% consistency.',
        'Phase 2 Requirements: 5% Profit Target, 4% Daily Drawdown (2.4% single-loss cap), 8% Overall Drawdown, 5 Minimum Trading Days, 60 Calendar Days time limit, <= 30% consistency.',
        'Phase 2 Reset: When Phase 1 is completed, Phase 2 starts with a completely fresh balance, fresh drawdown reference, fresh trading-day counter, fresh consistency calculation, and fresh 60-day clock. Phase 1 P&L does not carry into Phase 2.',
      ],
      tag: '2-STEP MODEL',
    },

    // 5. DAILY DRAWDOWN CALCULATION
    {
      id: 'rule-07',
      category: 'RISK',
      section: '5. Daily Drawdown Calculation',
      title: 'Start-of-Day Equity Reference & 9:00 AM IST Reset',
      points: [
        'Reference Point: Start-of-Day Equity (determined at market open).',
        'Daily Drawdown includes Realized P&L + Unrealized (floating) P&L.',
        'Continuous Monitoring: Calculated in real-time from live market-data ticks and secondary order fill execution events.',
        'Daily Reset Time: Exactly 9:00 AM IST at the beginning of the NSE trading day. Resets do NOT use UTC or midnight.',
        'Violation Protocol: If daily drawdown is breached (> 4%), the risk engine immediately force-closes all open positions, permanently disables further trading, logs the audit violation, and transitions account state to FAILED.',
        'A breached account is never permitted to place new orders.',
      ],
      tag: 'DAILY DRAWDOWN',
    },

    // 6. SINGLE-LOSS RULE
    {
      id: 'rule-08',
      category: 'RISK',
      section: '6. Single-Loss Rule',
      title: '2.4% Single Trade Loss Limit & Position Aggregation',
      points: [
        'Single Loss Limit: 2.4% of the relevant challenge account size (60% of the 4% daily loss cap).',
        'Definition of Single Trade: One complete trade/position from initial entry to final exit. Multiple orders that build, scale into, or partially close the same position are treated as ONE trade.',
        'Floating Loss Counts: If an open position temporarily reaches a floating loss greater than 2.4%, it is a breach even if the position subsequently recovers before closing.',
        'Calculation Basis: Pure Trading P&L is used. Statutory charges, exchange turnover fees, and brokerage are excluded from determining the 2.4% single-loss threshold.',
        'Forced 3:14 PM square-offs are normal trades and are subject to the single-loss rule.',
        'Splitting a single losing position into multiple orders to bypass the rule is detected and disallowed.',
      ],
      tag: 'SINGLE-LOSS CAP',
    },

    // 7. OVERALL DRAWDOWN
    {
      id: 'rule-09',
      category: 'RISK',
      section: '7. Overall Drawdown',
      title: 'Static Reference & 8.0% Boundary',
      points: [
        'Reference Point: Initial Starting Balance (STATIC). It does NOT trail higher with account equity (no high-water mark trailing during evaluation).',
        'Measurement: Equity-based (Floating P&L + Realized P&L).',
        'Example: On a ₹5,00,000 account, the maximum permitted equity decline is ₹40,000 (minimum equity floor of ₹4,60,000).',
        'Boundary Precision: Exactly 8.00% is SAFE. The account is breached only when cumulative drawdown strictly EXCEEDS 8.00% (e.g. 8.01%).',
        'Breach Action: Instant position liquidations, trading revoked, violation logged, and account marked FAILED.',
      ],
      tag: 'MAX DRAWDOWN',
    },

    // 8. TRADING DAYS
    {
      id: 'rule-10',
      category: 'EVALUATION',
      section: '8. Trading Days Definition',
      title: 'Active Trading Day Criteria',
      points: [
        'A trading day counts ONLY when there is at least ONE FILLED TRADE.',
        'Logging into the portal, viewing market charts, or placing unfilled/cancelled orders does NOT count.',
        'Multiple filled orders executed on the same calendar day count as ONE single trading day.',
        'Forced 3:14 PM auto square-offs count as a trading day because an actual simulated derivative position was filled and closed.',
      ],
      tag: 'TRADING DAYS',
    },

    // 9. TIME LIMIT
    {
      id: 'rule-11',
      category: 'EVALUATION',
      section: '9. Time Limit & Deadlines',
      title: 'Calendar Day Clock & Activation',
      points: [
        'Clock Start: The challenge clock begins precisely when the account is ACTIVATED (credentials generated/assigned), NOT upon payment or first trade.',
        'Calendar Days: Weekends and NSE market holidays continue to count toward the 30-day (1-Step / Phase 1) and 60-day (Phase 2) limits.',
        'Day 30 and Day 60 remain valid trading days until market close.',
        'Early Completion: A trader can qualify for review as soon as all objectives are met without having to wait until the final day.',
      ],
      tag: 'TIME LIMIT',
    },

    // 10. PROFIT TARGET & EQUITY
    {
      id: 'rule-12',
      category: 'EVALUATION',
      section: '10. Profit Target Calculation',
      title: 'Equity-Based Profit Target & Simultaneous Priority',
      points: [
        'Profit Target is Equity-Based: Floating unrealized profit counts toward target achievement (e.g. ₹5,50,000 equity on a ₹5,00,000 account satisfies 10%).',
        'Target Achievement ≠ Final Pass: Reaching the profit target alone does not trigger an instant pass. Minimum trading days, consistency limits, and zero-breach checks must all be satisfied.',
        'Simultaneous Rule Event Priority: If a profit-target condition and a drawdown/failure rule occur on the same market tick, FAIL TAKES PRIORITY. A trader cannot pass on an event that violates a risk rule.',
      ],
      tag: 'TARGET & PRIORITY',
    },

    // 11. CONSISTENCY RULE
    {
      id: 'rule-13',
      category: 'EVALUATION',
      section: '11. Consistency Rule (30% Cap)',
      title: 'Profit Consistency Formula',
      points: [
        'Formula: (Highest Single Profitable Day ÷ Total Positive Profit) × 100.',
        'Maximum Allowed: 30%. Exactly 30.00% is ALLOWED; strictly > 30.00% is a violation.',
        'Single Best Day: Only the single highest positive P&L day is evaluated.',
        'Zero / Negative Profit: If total positive profit is <= 0, consistency is not calculated; the account simply cannot pass because the profit target is unmet.',
        'Consistency is evaluated strictly against the specific phase’s trading history.',
      ],
      tag: 'CONSISTENCY',
    },

    // 12. EVALUATION FLOW & ADMIN REVIEW
    {
      id: 'rule-14',
      category: 'SYSTEM',
      section: '12. Account State Flow & Admin Review',
      title: 'Evaluation State Transitions',
      points: [
        'State Progression: ACTIVE → ELIGIBLE_FOR_REVIEW → ADMIN_REVIEW → ADMIN_APPROVED → PASSED.',
        'Automated Recommendation: The system recommends eligibility when all mathematical criteria (target, days, consistency, no breaches) are met, but does NOT silently finalize PASS.',
        'Admin Authority: Final authorization is performed by an authorized evaluation administrator who confirms telemetry and issues funded access.',
        'Failed States: Any hard breach moves the account from ACTIVE to FAILED immediately.',
      ],
      tag: 'STATE MACHINE',
    },

    // 13. RETRY POLICY & RULE VERSIONING
    {
      id: 'rule-15',
      category: 'SYSTEM',
      section: '13. Retry Policy & Rule Versioning',
      title: 'Challenge Retries & Immutable Rule Versions',
      points: [
        'Retry Policy: If an evaluation fails, the trader must purchase a new challenge to restart. Architecture supports future retry products.',
        'Rule Version Immutability: Rules are permanently locked to an account at the moment of challenge creation. Future platform rule changes never retroactively modify an existing account’s rule version.',
      ],
      tag: 'VERSIONING',
    },

    // 14. FUNDED ACCOUNT RULES
    {
      id: 'rule-16',
      category: 'FUNDED',
      section: '14. Funded Account Operating Rules',
      title: 'Funded Capital & Operating Boundaries',
      points: [
        'Capital Allocation: Funded account capital is equal to the challenge account size (e.g. ₹5L challenge → ₹5L funded account).',
        'Trading Scope: Remains Indian index F&O only, intraday only (no BTST), with mandatory 3:14 PM auto square-off and news trading permitted.',
        'Funded Risk Boundaries: 4% Max Daily Drawdown (SOD equity reference) and 8% Max Overall Drawdown (static starting balance reference).',
        'Funded Account Closure: Breaching daily (4%) or overall (8%) drawdown permanently closes the funded account. Profit already eligible for payout is honored; locked/carried-forward profit is forfeited upon closure.',
      ],
      tag: 'FUNDED STAGE',
    },

    // 15. PAYOUT CYCLES & MINIMUM WITHDRAWAL
    {
      id: 'rule-17',
      category: 'PAYOUT',
      section: '15. Payout Cycles & Eligibility',
      title: '14-Day Cycle & ₹4,000 Post-Split Minimum',
      points: [
        'Payout Cycle: Exactly every 14 Calendar Days, starting from the day the funded account becomes active (Days 1–14, 15–28, 29–42, etc.).',
        'First Payout Eligibility: Requires completion of the 1st 14-day cycle AND minimum 5 trading days logged within it. If fewer than 5 days occurred, profit rolls forward.',
        'Minimum Withdrawal Threshold: ₹4,000, measured strictly on the TRADER’S POST-SPLIT SHARE. (e.g. ₹5,000 gross profit at 70% split = ₹3,500 trader share; this is below ₹4,000, so it rolls forward to the next cycle).',
      ],
      tag: 'PAYOUT CYCLE',
    },

    // 16. PROFIT SPLIT SCALING TIERS
    {
      id: 'rule-18',
      category: 'PAYOUT',
      section: '16. Profit Split Scaling Tiers',
      title: '70/30 → 80/20 → 90/10 Scaling Structure',
      points: [
        'Base Split: Starts at 70% Trader / 30% Firm on funded activation.',
        'Tier 2 (80/20): Upgrades to 80% Trader / 20% Firm after 2 consecutive profitable payout cycles.',
        'Tier 3 (90/10): Upgrades to 90% Trader / 10% Firm after 3 consecutive profitable payout cycles.',
        'Losing Cycle Reset: A losing cycle immediately resets the streak back to 70/30, even if the trader was previously at 80/20 or 90/10.',
        'Zero-Profit Cycle: Preserves the existing streak (does not advance or reset).',
      ],
      tag: 'PROFIT SPLIT',
    },

    // 17. AVERAGE DAILY PROFIT PAYOUT METHOD
    {
      id: 'rule-19',
      category: 'PAYOUT',
      section: '17. Average Daily Profit Payout Method',
      title: 'Smoothing Algorithm & 2× Daily Cap',
      points: [
        'Step 1 (Average Daily Profit): Actual Pre-Cap Cycle Profit ÷ Number of Trading Days.',
        'Step 2 (Daily Cap): 2 × Average Daily Profit.',
        'Step 3 (Counted Profit): For each profitable day, Counted Profit = MIN(Actual Daily Profit, Daily Profit Cap). Losses are never capped.',
        'Step 4 (Carry-Forward): Profit earned above the 2× daily cap rolls forward into the next payout cycle. Carried-forward profit re-enters the next cycle’s averaging calculation and never expires.',
        'Loss Days: Included in the trading-day denominator for fair smoothing.',
      ],
      tag: 'PAYOUT METHOD',
    },

    // 18. LOSING CYCLE BEHAVIOR
    {
      id: 'rule-20',
      category: 'PAYOUT',
      section: '18. Losing Cycle Behavior',
      title: 'Zero Debt & Reset Mechanics',
      points: [
        'No Payout: A losing cycle generates no withdrawal.',
        'No Debt Creation: Losses incurred in a losing cycle are NOT carried forward as a debt against future cycle profits.',
        'Streak Reset: Resets the profit split streak back to 70/30 base.',
        'The next 14-day cycle begins cleanly.',
      ],
      tag: 'CYCLE RESET',
    },

    // 19. PLATFORM INTEGRITY & AUDIT TRAIL
    {
      id: 'rule-21',
      category: 'SYSTEM',
      section: '19. Audit Trail & Deterministic Engine',
      title: 'Precision & Audit Logging',
      points: [
        'Decimal Precision: All calculations use exact decimal arithmetic to eliminate floating-point rounding errors.',
        'Comprehensive Audit Trail: Every evaluation and funded state transition, drawdown calculation, order fill, and payout computation is timestamped and recorded in the audit log.',
        'Simulation Environment: Orders match against real NSE/BSE tick feeds with depth-calibrated simulated execution.',
      ],
      tag: 'INTEGRITY',
    },
  ];

  const filteredRules = fullRulebook.filter((r) => {
    const matchesCategory = activeCategory === 'ALL' || r.category === activeCategory;
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.points.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ padding: '3.5rem 0 6rem 0' }}>
      <div className="container-max">
        
        {/* Document-Style Header */}
        <div style={{ maxWidth: '820px', margin: '0 auto 3rem auto', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-emerald-light)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}
          >
            OFFICIAL BUSINESS SPECIFICATION
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.3rem, 4vw, 3.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
            }}
          >
            COMPLETE CHALLENGE & <br />
            <span className="gradient-text-emerald">FUNDED ACCOUNT RULES.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.65 }}>
            The definitive rulebook for Indian index derivatives evaluations, drawdown boundaries, single-loss limits, consistency thresholds, and payout calculations.
          </p>

          {/* Search Bar */}
          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(18, 24, 38, 0.95)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.65rem 1.25rem',
              gap: '0.75rem',
            }}
          >
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search rules (e.g. single loss, 3:14 PM, consistency, payout, 9:00 AM IST)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.92rem',
                width: '100%',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '0.45rem',
              marginTop: '1.25rem',
            }}
          >
            {[
              { id: 'ALL', label: 'All Rules (21 Sections)' },
              { id: 'SCOPE', label: '1. Scope & Style' },
              { id: 'EVALUATION', label: '2. Evaluation Models' },
              { id: 'RISK', label: '3. Drawdown & Risk Limits' },
              { id: 'FUNDED', label: '4. Funded Account' },
              { id: 'PAYOUT', label: '5. Payouts & Splits' },
              { id: 'SYSTEM', label: '6. State Flow & Integrity' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  background: activeCategory === cat.id ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.04)',
                  color: activeCategory === cat.id ? '#000000' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: activeCategory === cat.id ? 'var(--accent-emerald)' : 'var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Quick Summary (Simple 3-Card Visual Matrix) */}
        <div style={{ maxWidth: '1080px', margin: '0 auto 3.5rem auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald-light)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              QUICK REFERENCE
            </span>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
              Rules at a Glance
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.25rem',
            }}
            className="rules-summary-grid"
          >
            {/* Card 1: 1-Step */}
            <div
              className="glass-card"
              style={{
                padding: '1.75rem',
                borderRadius: 'var(--radius-xl)',
                border: '2px solid rgba(16, 185, 129, 0.4)',
                background: 'linear-gradient(180deg, rgba(16, 24, 38, 0.98) 0%, rgba(10, 14, 24, 0.98) 100%)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  SINGLE PHASE
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399', marginTop: '0.15rem' }}>
                  1-Step Challenge
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Profit Target</span>
                  <span className="font-mono" style={{ fontWeight: 800, color: '#34d399', fontSize: '1.05rem' }}>10%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Daily Drawdown</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#f87171' }}>4% (2.4% single)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Max Drawdown</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#f87171' }}>8% (Static)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Min Trading Days</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>6 Days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Time Limit</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>30 Days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Consistency Cap</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#fbbf24' }}>&le; 30% / day</span>
                </div>
              </div>
            </div>

            {/* Card 2: 2-Step */}
            <div
              className="glass-card"
              style={{
                padding: '1.75rem',
                borderRadius: 'var(--radius-xl)',
                border: '2px solid rgba(6, 182, 212, 0.4)',
                background: 'linear-gradient(180deg, rgba(14, 23, 40, 0.98) 0%, rgba(10, 14, 24, 0.98) 100%)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  TWO PHASES
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#22d3ee', marginTop: '0.15rem' }}>
                  2-Step Challenge
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Profit Target</span>
                  <span className="font-mono" style={{ fontWeight: 800, color: '#22d3ee', fontSize: '1.05rem' }}>8% &rarr; 5%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Daily Drawdown</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#f87171' }}>4% (2.4% single)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Max Drawdown</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#f87171' }}>8% (Static)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Min Trading Days</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>5 Days / Phase</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Time Limit</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>30d &rarr; 60d</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Consistency Cap</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#fbbf24' }}>&le; 30% / day</span>
                </div>
              </div>
            </div>

            {/* Card 3: Funded Account */}
            <div
              className="glass-card"
              style={{
                padding: '1.75rem',
                borderRadius: 'var(--radius-xl)',
                border: '2px solid rgba(251, 191, 36, 0.4)',
                background: 'linear-gradient(180deg, rgba(28, 24, 18, 0.98) 0%, rgba(10, 14, 24, 0.98) 100%)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  EARN REAL PAYOUTS
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.15rem' }}>
                  Funded Stage
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Profit Split</span>
                  <span className="font-mono" style={{ fontWeight: 800, color: '#fbbf24', fontSize: '1.05rem' }}>70% &rarr; 90%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Payout Cycle</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#34d399' }}>Every 14 Days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Min Withdrawal</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>₹4,000 (Trader share)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Min Active Days</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>5 Days / Cycle</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Risk Limits</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#f87171' }}>4% Daily / 8% Max</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Payout Smoothing</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#38bdf8' }}>2&times; Daily Avg Cap</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Universal Market Rules Strip */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-around',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span>
              <strong style={{ color: '#ffffff' }}>Instruments: </strong>
              NIFTY • BANKNIFTY • FINNIFTY • MIDCPNIFTY • SENSEX (F&O Only)
            </span>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <span>
              <strong style={{ color: '#ffffff' }}>Trading Style: </strong>
              Intraday Only (<strong style={{ color: '#22d3ee' }}>3:14 PM Auto Close</strong>)
            </span>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <span>
              <strong style={{ color: '#ffffff' }}>News Trading: </strong>
              <strong style={{ color: '#34d399' }}>100% Allowed</strong> (Budget, RBI, Expiry)
            </span>
          </div>
        </div>

        <style>{`
          @media (max-width: 840px) {
            .rules-summary-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* Full Document-Style Rule Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '980px', margin: '0 auto' }}>
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              id={rule.id}
              className="glass-card"
              style={{
                padding: '2rem 2.25rem',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-medium)',
                background: 'rgba(12, 17, 28, 0.96)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Rule Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.85rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {rule.section}
                  </span>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem', letterSpacing: '-0.01em' }}>
                    {rule.title}
                  </h2>
                </div>

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--accent-cyan)',
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {rule.tag}
                </span>
              </div>

              {/* Point-by-Point Direct Rules */}
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {rule.points.map((pt, idx) => (
                  <li key={idx}>
                    <span style={{ color: '#e2e8f0' }}>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Average Daily Profit Worked Table (Rule #19 Special Reference) */}
          <div
            className="glass-card"
            style={{
              padding: '2.25rem',
              borderRadius: 'var(--radius-xl)',
              border: '2px solid rgba(56, 189, 248, 0.3)',
              background: 'linear-gradient(180deg, rgba(14, 21, 37, 0.98) 0%, rgba(10, 15, 26, 0.98) 100%)',
              marginTop: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <Sliders size={20} color="#38bdf8" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                Worked Example: Average Daily Profit Payout Method
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Standard 5-day trading cycle with <strong>₹20,000</strong> actual pre-cap cycle profit. Average Daily Profit = ₹20,000 ÷ 5 = ₹4,000/day. Per-day cap = 2 × Average = <strong>₹8,000/day</strong>.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }} className="font-mono">
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>TRADING DAY</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>ACTUAL DAILY PROFIT</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>COUNTED THIS CYCLE</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px' }}>ROLLOVER TO NEXT CYCLE</th>
                  </tr>
                </thead>
                <tbody style={{ color: '#ffffff' }}>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 14px' }}>Day 1</td>
                    <td style={{ padding: '10px 14px' }}>₹2,000</td>
                    <td style={{ padding: '10px 14px', color: '#34d399' }}>₹2,000</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-dim)' }}>₹0</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 14px' }}>Day 2</td>
                    <td style={{ padding: '10px 14px' }}>₹1,000</td>
                    <td style={{ padding: '10px 14px', color: '#34d399' }}>₹1,000</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-dim)' }}>₹0</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 14px' }}>Day 3 (Outsized Win)</td>
                    <td style={{ padding: '10px 14px' }}>₹16,000</td>
                    <td style={{ padding: '10px 14px', color: '#fbbf24' }}>₹8,000 (Capped at 2× Avg)</td>
                    <td style={{ padding: '10px 14px', color: '#38bdf8' }}>+₹8,000 carried forward</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 14px' }}>Day 4</td>
                    <td style={{ padding: '10px 14px' }}>₹500</td>
                    <td style={{ padding: '10px 14px', color: '#34d399' }}>₹500</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-dim)' }}>₹0</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px' }}>Day 5</td>
                    <td style={{ padding: '10px 14px' }}>₹500</td>
                    <td style={{ padding: '10px 14px', color: '#34d399' }}>₹500</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-dim)' }}>₹0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Cycle Paid:</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>₹12,000</div>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Excess Rolls To Next Cycle:</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>+₹8,000 (Never Expires)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: '4.5rem' }}>
          <Button variant="primary" size="lg" isSimulatorLaunch>
            TRADER ROOM
          </Button>
        </div>
      </div>
    </div>
  );
}
