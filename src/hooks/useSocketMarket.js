import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const apiBase = import.meta.env.VITE_API_BASE_URL || '';
const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase);

console.log("Socket URL:", socketUrl);

export function useSocketMarket() {
  const [snapshot, setSnapshot] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log("✅ Connected:", socket.id);
      setConnected(true);
    });

    socket.on('connected', (data) => {
      console.log("📡 Server connected event:", data);
    });

    socket.on('market:update', (data) => {
      console.log("📈 Market update received:", data);
      //setSnapshot(data);
    });

    socket.on('disconnect', (reason) => {
      console.log("❌ Disconnected:", reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error("❌ Connect error:", err);
    });

    return () => socket.disconnect();
  }, []);

  return { snapshot, connected };
}