const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function isTokenExpired(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(atob(parts[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let token = localStorage.getItem('auth_token');

  // Check if token is expired
  if (token && isTokenExpired(token)) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    token = null;
    // Redirect to auth if we're on a protected page
    if (path !== '/auth/profile') {
      window.location.href = '/auth';
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for httpOnly token support
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // Redirect to login
      window.location.href = '/auth';
      throw new Error('Session expired. Please login again.');
    }

    const error = new Error(`Request failed: ${response.status}`);
    error.status = response.status;

    try {
      const errorData = await response.json();
      error.message = errorData.message || error.message;
    } catch {
      // Response body not JSON
    }

    throw error;
  }

  const body = await response.json();
  if (body && typeof body === 'object' && body.success === true && body.data !== undefined) {
    if (body.meta) {
      return { data: body.data, pagination: body.meta, meta: body.meta };
    }
    return body.data;
  }
  return body;
}

export const api = {
  // Auth endpoints
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    signup: (data) =>
      request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getProfile: () => request('/auth/profile'),
  },

  // Market data endpoints
  market: (limit = 80, currency = 'usd') => request(`/market?limit=${limit}&currency=${currency}`),
  markets: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
    return request(`/markets?${query.toString()}`);
  },
  coins: () => request('/coins'),
  insights: (currency = 'usd') => request(`/insights?currency=${currency}`),
  global: (currency = 'usd') => request(`/global?currency=${currency}`),
  trending: () => request('/trending'),
  coin: (id, currency = 'usd') => request(`/coins/${id}?currency=${currency}`),
  chart: (id, range, currency = 'usd') => request(`/coins/${id}/chart?range=${range}&currency=${currency}`),

  // Chat endpoint
  chat: (message, history = []) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }).then((response) => (response?.data ? response.data : response)),

  // Watchlist endpoints
  watchlist: {
    getCurrent: () => request('/watchlist'),
    getByUser: (userId) => request(`/watchlist/user/${userId}`),
    add: (coin) =>
      request('/watchlist/add', {
        method: 'POST',
        body: JSON.stringify(coin),
      }),
    remove: (coinId) =>
      request(`/watchlist/remove/${encodeURIComponent(coinId)}`, {
        method: 'DELETE',
      }),
  },

  // Portfolio endpoints
  portfolio: {
    get: () => request('/portfolio'),
    addHolding: (holding) =>
      request('/portfolio/holdings', {
        method: 'POST',
        body: JSON.stringify(holding),
      }),
    removeHolding: (id) =>
      request(`/portfolio/holdings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    analyze: (payload = {}) =>
      request('/portfolio/analyze', {
        method: 'POST',
        body: JSON.stringify(payload),
      }).then((response) => (response?.data ? response.data : response)),
    signal: () =>
      request('/portfolio/signal', {
        method: 'POST',
      }).then((response) => (response?.data ? response.data : response)),
  },

  // News endpoints
  news: (category = 'crypto', search = '') =>
    request(`/news/latest?category=${encodeURIComponent(category)}&search=${encodeURIComponent(search)}`).then((response) => response.data || response),
};
