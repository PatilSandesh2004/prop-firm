import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import apiClient, { ACCESS_TOKEN_STORAGE_KEY } from '../services/api';

const REFRESH_TOKEN_STORAGE_KEY = 'propfirm.refresh_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || '',
  );
  const [initializing, setInitializing] = useState(true);

  const applySession = useCallback((tokenResponse) => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenResponse.access_token);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokenResponse.refresh_token);
    setAccessToken(tokenResponse.access_token);
    setUser(tokenResponse.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    setAccessToken('');
    setUser(null);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await apiClient.post('/auth/login', { email, password });
      applySession(data);
      return data;
    },
    [applySession],
  );

  const register = useCallback(
    async ({ email, password, fullName, phone }) => {
      const { data } = await apiClient.post('/auth/register', {
        email,
        password,
        full_name: fullName || null,
        phone: phone || null,
      });
      applySession(data);
      return data;
    },
    [applySession],
  );

  // On first load, if a token survived from a previous session, confirm
  // it's still valid and restore the user -- otherwise drop it silently
  // (an expired/invalid token here should behave like "not logged in",
  // not like an error the user has to do anything about).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!accessToken) {
        setInitializing(false);
        return;
      }
      try {
        const { data } = await apiClient.get('/auth/me');
        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only ever run on mount -- accessToken changes after this are driven
    // by login()/register()/logout() themselves, which already set `user`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(user && accessToken),
    initializing,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
