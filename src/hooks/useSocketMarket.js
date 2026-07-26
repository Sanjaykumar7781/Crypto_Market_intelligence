import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const apiBase = import.meta.env.VITE_API_BASE_URL || '';
const socketUrl = import.meta.env.VITE_SOCKET_URL || (apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase) || window.location.origin.replace('5173', '8080');

export function useSocketMarket() {
  const [snapshot, setSnapshot] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('market:update', setSnapshot);

    return () => socket.disconnect();
  }, []);

  return { snapshot, connected };
}
