import React, { useState } from 'react';
import { PuterLoginDialog } from './PuterLoginDialog';
import { usePuterAuth } from './usePuterAuth';

interface PuterLoginButtonProps {
  userId: string;
}

export function PuterLoginButton({ userId }: PuterLoginButtonProps) {
  const { authenticated, username, loading, error, login, logout, clearError } =
    usePuterAuth(userId);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading) {
    return (
      <button
        disabled
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: '1px solid var(--border, #333)',
          background: 'transparent',
          color: 'var(--text-secondary, #888)',
          fontSize: 13,
          cursor: 'not-allowed',
        }}
      >
        Checking...
      </button>
    );
  }

  if (authenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--text-primary, #e0e0e0)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#4ade80',
              display: 'inline-block',
            }}
          />
          Puter: {username}
        </span>
        <button
          onClick={logout}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--border, #333)',
            background: 'transparent',
            color: '#ff6b6b',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          clearError();
          setDialogOpen(true);
        }}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: '1px solid var(--border, #333)',
          background: 'transparent',
          color: 'var(--text-primary, #e0e0e0)',
          fontSize: 13,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 16 }}>🔑</span>
        Sign in to Puter
      </button>
      <PuterLoginDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onLogin={async (u, p) => {
          await login(u, p);
          if (!error) setDialogOpen(false);
        }}
        error={error}
        loading={loading}
      />
    </>
  );
}