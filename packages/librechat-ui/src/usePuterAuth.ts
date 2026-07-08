import { useState, useEffect, useCallback } from 'react';

export interface PuterAuthState {
  authenticated: boolean;
  username: string | null;
  loading: boolean;
  error: string | null;
}

interface UsePuterAuthReturn extends PuterAuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function usePuterAuth(userId: string): UsePuterAuthReturn {
  const [state, setState] = useState<PuterAuthState>({
    authenticated: false,
    username: null,
    loading: true,
    error: null,
  });

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/puter/status?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        authenticated: data.authenticated ?? false,
        username: data.username ?? null,
        loading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [userId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const login = useCallback(
    async (username: string, password: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch('/api/puter/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, userId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Login failed');
        }

        const data = await res.json();
        setState((prev) => ({
          ...prev,
          authenticated: true,
          username: data.username,
          loading: false,
        }));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
        throw err;
      }
    },
    [userId],
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/puter/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch { }
    setState({
      authenticated: false,
      username: null,
      loading: false,
      error: null,
    });
  }, [userId]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return { ...state, login, logout, clearError };
}