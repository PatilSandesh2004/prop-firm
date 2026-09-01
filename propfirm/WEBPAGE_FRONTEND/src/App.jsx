import React, { useState, useEffect } from 'react';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AuthModal from './components/common/AuthModal';
import HomePage from './pages/HomePage';
import ChallengesPage from './pages/ChallengesPage';
import RulesPage from './pages/RulesPage';
import PlatformPage from './pages/PlatformPage';
import HowItWorksPage from './pages/HowItWorksPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Handle URL hash changes or browser history navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['home', 'challenges', 'rules', 'platform', 'how-it-works', 'about', 'faq'].includes(hash)) {
        setActivePage(hash);
      } else if (hash === 'login' || hash === 'signin') {
        setAuthMode('login');
        setAuthModalOpen(true);
      } else if (hash === 'register' || hash === 'signup') {
        setAuthMode('register');
        setAuthModalOpen(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigate = (pageId) => {
    setActivePage(pageId);
    window.location.hash = pageId === 'home' ? '' : pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
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
      />
    </div>
  );
}
