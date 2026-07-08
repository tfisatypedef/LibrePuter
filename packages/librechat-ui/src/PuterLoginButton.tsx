import React from 'react';

interface PuterLoginButtonProps {
  userId: string;
}

export function PuterLoginButton({ userId: _userId }: PuterLoginButtonProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 4,
        fontSize: 13,
        color: 'var(--text-secondary, #888)',
      }}
    >
      <a
        href="https://puter.com/dashboard"
        target="_blank"
        rel="noopener noreferrer"
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
          textDecoration: 'none',
        }}
      >
        <span style={{ fontSize: 16 }}>&#x1f511;</span>
        Get Puter Token
      </a>
      <span>Copy it from puter.com/dashboard and paste as API key in LibreChat</span>
    </div>
  );
}