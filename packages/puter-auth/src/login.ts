import type { LoginCredentials, LoginResponse, PuterAuthToken, PuterAuthConfig, SessionStatus } from './types';
import { PuterAuthError } from './types';

export class PuterAuthClient {
  private config: PuterAuthConfig;
  private currentToken: PuterAuthToken | null = null;

  constructor(config: PuterAuthConfig) {
    this.config = config;
  }

  get serverUrl(): string {
    return this.config.serverUrl;
  }

  get isAuthenticated(): boolean {
    if (!this.currentToken) return false;
    return Date.now() < this.currentToken.expiresAt;
  }

  get token(): string | null {
    if (!this.isAuthenticated) return null;
    return this.currentToken!.token;
  }

  get username(): string | null {
    return this.currentToken?.username ?? null;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const url = `${this.config.serverUrl}/auth/login`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      redirect: 'manual',
    });

    if (!response.ok) {
      const body = await response.text();
      let message = 'Login failed';
      try {
        const parsed = JSON.parse(body);
        message = parsed.error?.message ?? parsed.message ?? message;
      } catch { }
      throw new PuterAuthError(message, response.status);
    }

    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) {
      throw new PuterAuthError('No session cookie returned from Puter');
    }

    const cookieMatch = setCookie.match(
      /(?:puter_token|puter_auth_token)=([^;]+)/,
    );
    const sessionToken = cookieMatch?.[1];
    if (!sessionToken) {
      throw new PuterAuthError('Could not extract session token from cookie');
    }

    const body = await response.json();
    const username = body.user?.username ?? credentials.username;

    this.currentToken = {
      token: sessionToken,
      createdAt: Date.now(),
      expiresAt: this.parseExpiresFromCookie(setCookie),
      username,
    };

    return {
      sessionToken,
      user: { uuid: body.user?.uuid ?? '', username },
    };
  }

  async checkSession(token: string): Promise<SessionStatus> {
    const url = `${this.config.serverUrl}/auth/me`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Cookie: `puter_auth_token=${token}`,
      },
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    const body = await response.json();
    return {
      authenticated: true,
      username: body.user?.username,
    };
  }

  private parseExpiresFromCookie(cookie: string): number {
    const expiresMatch = cookie.match(/expires=([^;]+)/i);
    if (expiresMatch) {
      return new Date(expiresMatch[1]).getTime();
    }
    const maxAgeMatch = cookie.match(/max-age=(\d+)/i);
    if (maxAgeMatch) {
      return Date.now() + parseInt(maxAgeMatch[1]) * 1000;
    }
    return Date.now() + 24 * 60 * 60 * 1000;
  }

  clearSession(): void {
    this.currentToken = null;
  }
}