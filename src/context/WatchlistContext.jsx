import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

const WatchlistContext = createContext(null);
const STORAGE_KEY = 'crypto-market-watchlist';

function normalizeWatchlistItem(item) {
  if (!item) return item;
  return {
    ...item,
    id: item.id || item.coinId || item._id,
  };
}

function getStoredWatchlist() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return Array.isArray(stored) ? stored.map(normalizeWatchlistItem) : [];
  } catch {
    return [];
  }
}

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
}

export function WatchlistProvider({ children }) {
  const [items, setItems] = useState(getStoredWatchlist);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('auth_token'));

  useEffect(() => {
    const handleAuthUpdated = () => {
      setAuthToken(localStorage.getItem('auth_token'));
    };

    window.addEventListener('authUpdated', handleAuthUpdated);
    window.addEventListener('storage', handleAuthUpdated);

    return () => {
      window.removeEventListener('authUpdated', handleAuthUpdated);
      window.removeEventListener('storage', handleAuthUpdated);
    };
  }, []);

  useEffect(() => {
    const user = getAuthUser();
    if (!authToken || !user?.id) {
      setItems([]);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    let isMounted = true;

    api.watchlist
      .getCurrent()
      .then((response) => {
        const watchlist = response?.data || response;
        const remoteCoins = Array.isArray(watchlist?.coins) ? watchlist.coins : [];
        const normalizedCoins = remoteCoins.map(normalizeWatchlistItem);
        if (isMounted) {
          setItems(normalizedCoins);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedCoins));
        }
      })
      .catch(() => {
        // Keep local state if remote fetch fails
      });

    return () => {
      isMounted = false;
    };
  }, [authToken]);

  function persist(next) {
    const normalizedNext = next.map(normalizeWatchlistItem);
    setItems(normalizedNext);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedNext));
  }

  const toggle = useCallback(
    async (coin) => {
      const token = localStorage.getItem('auth_token');
      const user = getAuthUser();
      const normalizedCoin = normalizeWatchlistItem(coin);
      const exists = items.some((item) => item.id === normalizedCoin.id || item.coinId === normalizedCoin.id);

      if (token && user?.id) {
        try {
          if (exists) {
            await api.watchlist.remove(normalizedCoin.id);
            const next = items.filter((item) => item.id !== normalizedCoin.id && item.coinId !== normalizedCoin.id);
            persist(next);
            return true;
          }

          await api.watchlist.add({
            coinId: normalizedCoin.id,
            symbol: normalizedCoin.symbol,
            name: normalizedCoin.name,
            image: normalizedCoin.image,
          });
          const next = [...items, normalizedCoin];
          persist(next);
          return true;
        } catch (error) {
          console.error('Watchlist sync failed:', error);
          // fall back to local persistence if the backend fails
        }
      }

      const next = exists ? items.filter((item) => item.id !== normalizedCoin.id && item.coinId !== normalizedCoin.id) : [...items, normalizedCoin];
      persist(next);
      return true;
    },
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      toggle,
      isSaved: (id) => items.some((item) => item.id === id || item.coinId === id),
    }),
    [items, toggle],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWatchlist() {
  return useContext(WatchlistContext);
}
