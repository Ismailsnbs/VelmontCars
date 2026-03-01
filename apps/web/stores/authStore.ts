import { create } from 'zustand';
import api from '@/lib/api';
import { disconnectSocket } from '@/hooks/useSocket';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  galleryId: string | null;
  galleryName?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  initialize: () => Promise<void>;
}

// Guard against concurrent initialize() calls (K-FE2)
let initializePromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const result = data.data;

    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    // Presence cookie so Next.js edge middleware can detect auth state.
    // The cookie is NOT the JWT — real security is enforced by the API.
    document.cookie = 'auth_session=1; path=/; SameSite=Lax';

    set({
      user: result.user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  register: async (registerData) => {
    const { data } = await api.post('/auth/register', registerData);
    const result = data.data;

    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    // Presence cookie so Next.js edge middleware can detect auth state.
    document.cookie = 'auth_session=1; path=/; SameSite=Lax';

    set({
      user: result.user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    disconnectSocket();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Clear the middleware presence cookie on logout.
    document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    set({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/login';
  },

  fetchUser: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  initialize: async () => {
    // Idempotency guard — concurrent calls (master + dashboard layouts) share one request
    if (initializePromise) return initializePromise;

    const run = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        set({ isLoading: false });
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        document.cookie = 'auth_session=1; path=/; SameSite=Lax';
        set({ user: data.data, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        set({ user: null, isAuthenticated: false, isLoading: false });
      } finally {
        initializePromise = null;
      }
    };

    initializePromise = run();
    return initializePromise;
  },
}));
