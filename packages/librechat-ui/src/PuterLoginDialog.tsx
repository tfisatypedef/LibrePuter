import React, { useState } from 'react';

interface PuterLoginDialogProps {
  open: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
  error: string | null;
  loading: boolean;
}

export function PuterLoginDialog({
  open,
  onClose,
  onLogin,
  error,
  loading,
}: PuterLoginDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(username, password);
  };

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
          Connect to Puter to access AI models
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                marginBottom: 6,
                opacity: 0.8,
              }}
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #333)',
                background: 'var(--input-bg, #16213e)',
                color: 'inherit',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
              placeholder="Puter username"
              disabled={loading}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                marginBottom: 6,
                opacity: 0.8,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border, #333)',
                background: 'var(--input-bg, #16213e)',
                color: 'inherit',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
              placeholder="Puter password"
              disabled={loading}
            />
          </div>

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
              type="submit"
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background: loading ? '#555' : '#4a6cf7',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}