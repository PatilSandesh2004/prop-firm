import React, { useEffect, useState } from 'react';
import Navbar from './marketing/components/common/Navbar';
import Footer from './marketing/components/common/Footer';
import AuthModal from './marketing/components/common/AuthModal';
import HomePage from './marketing/pages/HomePage';
import ChallengesPage from './marketing/pages/ChallengesPage';
import RulesPage from './marketing/pages/RulesPage';
import PlatformPage from './marketing/pages/PlatformPage';
import HowItWorksPage from './marketing/pages/HowItWorksPage';
import AboutPage from './marketing/pages/AboutPage';
import FAQPage from './marketing/pages/FAQPage';
import TerminalApp from './terminal/TerminalApp';
import { useAuth } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationContext';

const MARKETING_PAGES = ['home', 'challenges', 'rules', 'platform', 'how-it-works', 'about', 'faq'];

export default function App() {
  const { isAuthenticated, initializing } = useAuth();
  const [activePage, setActivePage] = useState('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleNavigate = (pageId) => {
    if (pageId === 'terminal' && !isAuthenticated) {
      handleOpenAuth('login');
      return;
    }
    setActivePage(pageId);
    window.location.hash = pageId === 'home' ? '' : pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle URL hash changes or browser history navigation. Deferred until
  // session restoration (AuthContext's `initializing`) finishes, so a
  // reload on #terminal from an already-logged-in session lands back in
  // the terminal instead of racing the login modal open before
  // `isAuthenticated` has had a chance to become true.
  useEffect(() => {
    if (initializing) return;
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (MARKETING_PAGES.includes(hash)) {
        setActivePage(hash);
      } else if (hash === 'terminal') {
        handleNavigate('terminal');
      } else if (hash === 'login' || hash === 'signin') {
        handleOpenAuth('login');
      } else if (hash === 'register' || hash === 'signup') {
        handleOpenAuth('register');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, initializing]);

  const handleExitTerminal = () => {
    handleNavigate('home');
  };

  if (initializing) {
    // Restoring a previous session (checking a saved token against
    // /auth/me) -- avoid flashing the logged-out marketing shell first.
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        Loading...
      </div>
    );
  }

  if (activePage === 'terminal' && isAuthenticated) {
    return <TerminalApp onExit={handleExitTerminal} />;
  }

  return (
    <NavigationProvider navigate={handleNavigate} openAuth={handleOpenAuth}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        {/* Sticky Navigation Header with Date & Live Indices Ticker */}
        <Navbar
          activePage={activePage}
          onNavigate={handleNavigate}
          onOpenAuth={handleOpenAuth}
        />

        {/* Main Routed Page Content */}
        <div style={{ flex: 1 }}>
          {activePage === 'home' && (
            <HomePage
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
            />
          )}
          {activePage === 'challenges' && (
            <ChallengesPage
              onOpenAuth={handleOpenAuth}
            />
          )}
          {activePage === 'rules' && (
            <RulesPage
              onOpenAuth={handleOpenAuth}
            />
          )}
          {activePage === 'platform' && (
            <PlatformPage
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
            />
          )}
          {activePage === 'how-it-works' && (
            <HowItWorksPage
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
            />
          )}
          {activePage === 'about' && (
            <AboutPage
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
            />
          )}
          {activePage === 'faq' && (
            <FAQPage
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
            />
          )}
        </div>

        {/* Persistent Footer */}
        <Footer
          onNavigate={handleNavigate}
          onOpenAuth={handleOpenAuth}
        />

        {/* Authentication Modal */}
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={() => handleNavigate('terminal')}
        />
      </div>
    </NavigationProvider>
  );
}
