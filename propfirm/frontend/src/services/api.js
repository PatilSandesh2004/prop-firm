import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken = localStorage.getItem('auth_token') || '';
let refreshToken = localStorage.getItem('refresh_token') || '';
// Called after a silent token refresh succeeds/fails so App.jsx can keep its
// own `token` state in sync (axios has no reason to know about React state).
let onTokenRefreshed = null;

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// A 15-minute access token expiring mid-session is expected, not exceptional
// -- silently exchange the refresh token for a new pair instead of forcing
// the user back to the login screen every time it happens.
let refreshInFlight = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');
    if (error.response?.status !== 401 || isAuthRoute || original?._retried) {
      return Promise.reject(error);
    }
    if (!refreshToken) {
      return Promise.reject(error);
    }

    original._retried = true;
    try {
      if (!refreshInFlight) {
        refreshInFlight = apiClient
          .post('/auth/refresh', { refresh_token: refreshToken })
          .finally(() => {
            refreshInFlight = null;
          });
      }
      const { data } = await refreshInFlight;
      setAuthToken(data.access_token, data.refresh_token);
      onTokenRefreshed?.(data);
      original.headers.Authorization = `Bearer ${data.access_token}`;
      return apiClient(original);
    } catch (refreshError) {
      setAuthToken('', '');
      onTokenRefreshed?.(null);
      return Promise.reject(refreshError);
    }
  }
);

export const setAuthToken = (token, newRefreshToken) => {
  authToken = token || '';
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }

  if (newRefreshToken !== undefined) {
    refreshToken = newRefreshToken || '';
    if (newRefreshToken) {
      localStorage.setItem('refresh_token', newRefreshToken);
    } else {
      localStorage.removeItem('refresh_token');
    }
  }
};

export const getAuthToken = () => authToken;

export const setOnTokenRefreshed = (callback) => {
  onTokenRefreshed = callback;
};

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (email, password) => {
  const response = await apiClient.post('/auth/register', { email, password });
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const getAccounts = async () => {
  const response = await apiClient.get('/accounts');
  return response.data;
};

export const getActiveInstruments = async (params = {}) => {
  const response = await apiClient.get('/instruments', { params });
  return response.data;
};

export const getUnderlyings = async () => {
  const response = await apiClient.get('/instruments/meta/underlyings');
  return response.data;
};

export const getExpiries = async (underlying) => {
  const response = await apiClient.get('/instruments/meta/expiries', {
    params: { underlying },
  });
  return response.data;
};

export const getQuote = async (symbol) => {
  const response = await apiClient.get('/market/quote', { params: { symbol } });
  return response.data;
};

export const getQuotes = async (symbols) => {
  const response = await apiClient.get('/market/quotes', {
    params: { symbols: symbols.join(',') },
  });
  return response.data;
};

export const getDepth = async (symbol) => {
  const response = await apiClient.get('/market/depth', { params: { symbol } });
  return response.data;
};

export const getCandles = async (symbol, timeframe = '1m', limit = 200) => {
  const response = await apiClient.get('/market/candles', {
    params: { symbol, timeframe, limit },
  });
  return response.data;
};

export const getOptionChain = async (underlying, expiry) => {
  const response = await apiClient.get('/market/option-chain', {
    params: { underlying, expiry },
  });
  return response.data;
};

export const placeOrder = async (accountId, orderData) => {
  const response = await apiClient.post(`/accounts/${accountId}/orders`, orderData);
  return response.data;
};

export const getOrders = async (accountId) => {
  const response = await apiClient.get(`/accounts/${accountId}/orders`);
  return response.data;
};

export const cancelOrder = async (accountId, orderId) => {
  const response = await apiClient.post(`/accounts/${accountId}/orders/${orderId}/cancel`);
  return response.data;
};

export const getPositions = async (accountId) => {
  const response = await apiClient.get(`/accounts/${accountId}/positions`);
  return response.data;
};

export const getClosedPositions = async (accountId) => {
  const response = await apiClient.get(`/accounts/${accountId}/positions/closed`);
  return response.data;
};

export const getAccountSummary = async (accountId) => {
  const response = await apiClient.get(`/accounts/${accountId}/summary`);
  return response.data;
};

export const getTrades = async (accountId) => {
  const response = await apiClient.get(`/accounts/${accountId}/trades`);
  return response.data;
};

export default apiClient;
