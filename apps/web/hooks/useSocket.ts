'use client';

import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { io, Socket } from 'socket.io-client';

// Socket URL — /api prefix'i çıkar, base URL al
const SOCKET_URL =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

// Singleton socket instance — uygulama boyunca tek bağlantı
let socketInstance: Socket | null = null;

// Reactive connected state (U-FE1) — subscribers notified on connect/disconnect
let connectedState = false;
const connectedSubscribers = new Set<() => void>();
function notifyConnected(val: boolean) {
  connectedState = val;
  connectedSubscribers.forEach(cb => cb());
}
function subscribeConnected(cb: () => void) {
  connectedSubscribers.add(cb);
  return () => { connectedSubscribers.delete(cb); };
}
function getConnectedSnapshot() { return connectedState; }
function getServerSnapshot() { return false; }

/**
 * Mevcut singleton socket instance'ını döner.
 * React context dışında (örn. servis katmanı) kullanım için.
 */
export function getSocket(): Socket | null {
  return socketInstance;
}

/**
 * Singleton socket bağlantısını oluşturur veya mevcut olanı döner.
 * Token yoksa null döner.
 */
function getOrCreateSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance?.id);
      notifyConnected(true);
    });

    socketInstance.on('disconnect', (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
      notifyConnected(false);
    });

    socketInstance.on('connect_error', (err: Error) => {
      console.error('[Socket] Connection error:', err.message);
    });
  }

  return socketInstance;
}

/**
 * Token değiştiğinde (login/logout) singleton socket'ı sıfırlar.
 * authStore.logout() çağrısında bu fonksiyon çağrılmalı.
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    notifyConnected(false);
    console.log('[Socket] Singleton destroyed');
  }
}

export interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  on: (event: string, handler: (...args: unknown[]) => void) => () => void;
  off: (event: string, handler?: (...args: unknown[]) => void) => void;
  emit: (event: string, data?: unknown) => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const sock = getOrCreateSocket();
    socketRef.current = sock;
    // Singleton lifecycle — component unmount'ta socket'ı kapatmıyoruz
    // disconnectSocket() yalnızca logout'ta çağrılır
  }, []);

  /**
   * Verilen event'e handler bağlar.
   * Return: cleanup fonksiyonu — useEffect içinde çağır.
   */
  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void): (() => void) => {
      const sock = socketInstance;
      if (sock) {
        sock.on(event, handler);
      }
      return () => {
        if (sock) {
          sock.off(event, handler);
        }
      };
    },
    [],
  );

  const off = useCallback(
    (event: string, handler?: (...args: unknown[]) => void): void => {
      socketInstance?.off(event, handler);
    },
    [],
  );

  const emit = useCallback((event: string, data?: unknown): void => {
    socketInstance?.emit(event, data);
  }, []);

  // Reactive connected state — re-renders on connect/disconnect events
  const connected = useSyncExternalStore(subscribeConnected, getConnectedSnapshot, getServerSnapshot);

  return {
    socket: socketRef.current,
    connected,
    on,
    off,
    emit,
  };
}
