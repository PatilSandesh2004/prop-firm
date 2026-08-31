import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Login has been removed for this deployment -- the backend no longer
// requires a bearer token at all (every request resolves to the single
// demo trading user, see backend/app/dependencies/auth.py), so this
// client sends no Authorization header and needs no token/refresh
// machinery. getMe() still works -- it just returns that fixed user now.
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
