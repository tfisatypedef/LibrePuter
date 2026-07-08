export interface LibrePuterConfig {
  puterUrl: string;
  librechatUrl: string;
}

export interface TokenRecord {
  userId: string;
  token: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

export class ProxyError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public upstreamStatus?: number,
  ) {
    super(message);
    this.name = 'ProxyError';
  }
}