import { useState, useEffect, useCallback } from 'react';

export interface PuterAuthState {
  authenticated: boolean;
  username: string | null;
  loading: boolean;
  error: string | null;
  token: string | null;
}

interface UsePuterAuthReturn extends PuterAuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export function usePuterAuth(userId: string): UsePuterAuthReturn {
  const [state, setState] = useState<PuterAuthState>({
    authenticated: false,
    username: null,
    loading: true,
    error: null,
    token: null,
  });

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/puter/status?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        authenticated: data.authenticated ?? false,
        username: data.username ?? null,
        token: data.token ?? null,
        loading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [userId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const signIn = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      let token: string | null = null;
      let username: string | null = null;

      if (typeof puter !== 'undefined' && puter.auth) {
        await puter.auth.signIn();
        const user = await puter.auth.getUser();
        username = user?.username ?? null;
        token = user?.authToken ?? null;
      }

      if (!token) {
        throw new Error('Could not obtain Puter auth token. Make sure Puter.js is loaded.');
      }

      const res = await fetch('/api/puter/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken: token, username, userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to register Puter session');
      }

      setState((prev) => ({
        ...prev,
        authenticated: true,
        username,
        token,
        loading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
      throw err;
    }
  }, [userId]);

  const signOut = useCallback(async () => {
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
      token: null,
    });
  }, [userId]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return { ...state, signIn, signOut, clearError };
}