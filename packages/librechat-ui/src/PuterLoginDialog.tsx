import React from 'react';

interface PuterLoginDialogProps {
  open: boolean;
  onClose: () => void;
  onSignIn: () => Promise<void>;
  error: string | null;
  loading: boolean;
}

export function PuterLoginDialog({
  open,
  onClose,
  onSignIn,
  error,
  loading,
}: PuterLoginDialogProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          background: 'var(--surface, #1a1a2e)',
          borderRadius: 12,
          padding: 32,
          width: 380,
          color: 'var(--text-primary, #e0e0e0)',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>
          Sign in to Puter
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, opacity: 0.7 }}>
          Connect your Puter account to access 500+ AI models.
          Your Puter account covers the usage costs — you pay nothing.
        </p>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(255, 50, 50, 0.15)',
              color: '#ff6b6b',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid var(--border, #333)',
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: 14,
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSignIn}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: loading ? '#555' : '#4a6cf7',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Sign in with Puter'}
          </button>
        </div>
      </div>
    </div>
  );
}