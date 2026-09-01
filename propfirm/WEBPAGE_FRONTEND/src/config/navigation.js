// Centralized configuration for the Public Ecosystem Marketing Website

// The trader room / platform app URL (resolves from VITE_TRADING_APP_URL or fallback)
export const TRADING_APP_URL =
  import.meta.env.VITE_TRADING_APP_URL || 'http://localhost:5173';

export const NAV_LINKS = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'challenges', label: 'Challenges', path: '/challenges' },
  { id: 'rules', label: 'Rules', path: '/rules' },
  { id: 'platform', label: 'Platform', path: '/platform' },
  { id: 'how-it-works', label: 'How It Works', path: '/how-it-works' },
  { id: 'about', label: 'About', path: '/about' },
  { id: 'faq', label: 'FAQ', path: '/faq' },
];

export const BRAND_CONFIG = {
  name: 'PROPFIRM',
  suffix: '.IN',
  tagline: 'Trade with purpose. Perform with discipline.',
  heroHeadline: 'BUILT FOR THOSE WHO TAKE TRADING SERIOUSLY.',
  heroEyebrow: 'BUILT FOR INDIAN TRADERS',
  heroSubheadline:
    'A modern trading ecosystem built around performance, risk discipline, and the evolving needs of Indian market participants.',
  ctaPrimaryLabel: 'TRADER ROOM',
  ctaSecondaryLabel: 'EXPLORE CHALLENGES',
  terminalDisclosure: 'Access your dedicated trading desk and account telemetry.',
  marketSessionHours: '09:15 AM – 03:30 PM IST',
  intradayAutoSquareOffTime: '03:14 PM IST',
  supportedUnderlyings: ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'],
};

// Challenge Packages & Rules based on propfirm_rules_v2.md
export const CHALLENGE_PACKAGES = [
  { size: '₹1,00,000', sizeRaw: 100000, label: '1L', fee1Step: '₹3,499', fee2Step: '₹2,999' },
  { size: '₹2,00,000', sizeRaw: 200000, label: '2L', fee1Step: '₹4,999', fee2Step: '₹3,999' },
  { size: '₹3,00,000', sizeRaw: 300000, label: '3L', fee1Step: '₹6,499', fee2Step: '₹5,499' },
  { size: '₹5,00,000', sizeRaw: 500000, label: '5L', fee1Step: '₹8,999', fee2Step: '₹7,999', isPopular: true, badge: 'Popular' },
  { size: '₹10,00,000', sizeRaw: 1000000, label: '10L', fee1Step: '₹13,999', fee2Step: '₹11,999', badge: 'Pro' },
];

export const INDICES_FEED = [
  { symbol: 'NIFTY 50', baseLtp: 25124.80, change: '+0.42%', isPositive: true },
  { symbol: 'BANKNIFTY', baseLtp: 52340.50, change: '+0.68%', isPositive: true },
  { symbol: 'FINNIFTY', baseLtp: 23610.20, change: '+0.35%', isPositive: true },
  { symbol: 'MIDCPNIFTY', baseLtp: 12680.15, change: '+0.55%', isPositive: true },
  { symbol: 'SENSEX', baseLtp: 82410.90, change: '+0.38%', isPositive: true },
];
