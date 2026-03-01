'use client';

import { useSocketNotifications } from '@/hooks/useSocketNotifications';

interface SocketProviderProps {
  children: React.ReactNode;
}

/**
 * Socket bildirim dinleyicisini mount eden istemci bileşeni.
 * Yalnizca authenticate edilmis kullanicilara ait layout'larda kullanilmali.
 * Server component olan layout'lara bu component wrapper olarak eklenir.
 */
export function SocketProvider({ children }: SocketProviderProps): React.ReactElement {
  useSocketNotifications();
  return <>{children}</>;
}
