import React, { createContext, useContext } from 'react';

const NavigationContext = createContext(null);

// Lets any component (in particular the shared marketing <Button>, which is
// rendered from many pages that don't otherwise thread onNavigate/onOpenAuth
// down to it) trigger in-app navigation or open the sign-in modal without
// prop-drilling through every page and section component.
export function NavigationProvider({ navigate, openAuth, children }) {
  return (
    <NavigationContext.Provider value={{ navigate, openAuth }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return ctx;
}
