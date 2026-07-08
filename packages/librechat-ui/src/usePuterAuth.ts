import { useState, useEffect, useCallback } from 'react';

export interface PuterAuthState {
  authenticated: boolean;
  username: string | null;
  loading: boolean;
  error: string | null;
}

interface UsePuterAuthReturn extends PuterAuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export function usePuterAuth(_userId: string): UsePuterAuthReturn {
  const [state, setState] = useState<PuterAuthState>({
    authenticated: false,
    username: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    setState((prev) => ({ ...prev, loading: false }));
  }, []);

  const signIn = useCallback(async () => {
    window.open('https://puter.com/dashboard', '_blank');
  }, []);

  const signOut = useCallback(async () => {
    setState({
      authenticated: false,
      username: null,
      loading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return { ...state, signIn, signOut, clearError };
}