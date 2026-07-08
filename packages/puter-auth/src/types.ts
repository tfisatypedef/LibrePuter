export interface PuterAuthConfig {
  serverUrl: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  sessionToken: string;
  user: {
    uuid: string;
    username: string;
  };
}

export interface SessionStatus {
  authenticated: boolean;
  username?: string;
  expiresAt?: number;
}

export interface PuterAuthToken {
  token: string;
  createdAt: number;
  expiresAt: number;
  username: string;
}

export class PuterAuthError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'PuterAuthError';
  }
}