'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { debug } from '@/lib/utils';

type ReconnectCallback = () => void;

export function useSocket(): {
  socket: Socket | null;
  connected: boolean;
  onReconnect: (callback: ReconnectCallback) => void;
} {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectCallbackRef = useRef<ReconnectCallback | null>(null);
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const socketInstance = io(socketUrl, {
      auth: {
        apiKey: process.env.NEXT_PUBLIC_SOCKET_API_KEY,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      debug.log('Connected to server');
      const wasReconnect = wasConnectedRef.current;
      setConnected(true);
      wasConnectedRef.current = true;

      if (wasReconnect && reconnectCallbackRef.current) {
        debug.log('Socket reconnected, running callback...');
        reconnectCallbackRef.current();
      }
    });

    socketInstance.on('disconnect', (reason) => {
      debug.log('Disconnected from server:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      if (socketInstance.active) {
        debug.log('Connection error, auto-reconnecting:', error.message);
      } else {
        console.error('Connection denied by server:', error.message);
      }
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const onReconnect = (callback: ReconnectCallback) => {
    reconnectCallbackRef.current = callback;
  };

  return { socket, connected, onReconnect };
}
