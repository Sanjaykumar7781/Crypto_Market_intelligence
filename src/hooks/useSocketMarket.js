import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin.replace('5173', '8080');

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
