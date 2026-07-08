import type { TokenRecord } from './types';

export class TokenStore {
  private tokens: Map<string, TokenRecord> = new Map();

  set(userId: string, record: TokenRecord): void {
    this.tokens.set(userId, record);
  }

  get(userId: string): TokenRecord | undefined {
    const record = this.tokens.get(userId);
    if (!record) return undefined;
    if (Date.now() >= record.expiresAt) {
      this.tokens.delete(userId);
      return undefined;
    }
    return record;
  }

  delete(userId: string): void {
    this.tokens.delete(userId);
  }

  has(userId: string): boolean {
    const record = this.tokens.get(userId);
    if (!record) return false;
    if (Date.now() >= record.expiresAt) {
      this.tokens.delete(userId);
      return false;
    }
    return true;
  }

  getAll(): TokenRecord[] {
    this.cleanup();
    return Array.from(this.tokens.values());
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.tokens) {
      if (now >= record.expiresAt) {
        this.tokens.delete(key);
      }
    }
  }
}