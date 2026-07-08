import { Router } from 'express';
import { PuterAuthClient } from '@libreputer/puter-auth';
import type { LibrePuterConfig } from './types';
import { TokenStore } from './tokenStore';

export function createPuterProxyRouter(config: LibrePuterConfig): Router {
  const router = Router();
  const tokenStore = new TokenStore();

  // POST /api/puter/login — authenticate a user with Puter
  router.post('/login', async (req, res) => {
    try {
      const { username, password, userId } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      const authClient = new PuterAuthClient({ serverUrl: config.puterUrl });
      const loginResult = await authClient.login({ username, password });

      tokenStore.set(userId, {
        userId,
        token: loginResult.sessionToken,
        username: loginResult.user.username,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      res.json({
        authenticated: true,
        username: loginResult.user.username,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      const status =
        err instanceof Error && 'statusCode' in err
          ? (err as any).statusCode
          : 500;
      res.status(status).json({ error: message });
    }
  });

  // GET /api/puter/status — check auth status for a user
  router.get('/status', (req, res) => {
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const record = tokenStore.get(userId);
    if (!record) {
      res.json({ authenticated: false });
      return;
    }

    res.json({
      authenticated: true,
      username: record.username,
    });
  });

  // POST /api/puter/logout — clear session for a user
  router.post('/logout', (req, res) => {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    tokenStore.delete(userId);
    res.json({ success: true });
  });

  // GET /api/puter/models — fetch available models from Puter
  router.get('/models', async (_req, res) => {
    try {
      const response = await fetch(
        `${config.puterUrl}/puterai/chat/models`,
      );
      if (!response.ok) {
        res.status(response.status).json({
          error: 'Failed to fetch models from Puter',
        });
        return;
      }
      const data = await response.json();
      res.json(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(502).json({ error: `Puter connection failed: ${message}` });
    }
  });

  // GET /api/puter/models/details — fetch detailed model info
  router.get('/models/details', async (_req, res) => {
    try {
      const response = await fetch(
        `${config.puterUrl}/puterai/chat/models/details`,
      );
      if (!response.ok) {
        res.status(response.status).json({
          error: 'Failed to fetch model details from Puter',
        });
        return;
      }
      const data = await response.json();
      res.json(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(502).json({ error: `Puter connection failed: ${message}` });
    }
  });

  // ALL /api/puter/proxy/v1/* — proxy AI requests with auth
  router.all('/proxy/v1/*', async (req, res) => {
    const userId = req.headers['x-librechat-userid'] as string;

    if (!userId) {
      res.status(401).json({ error: 'x-librechat-userid header required' });
      return;
    }

    const record = tokenStore.get(userId);
    if (!record) {
      res.status(401).json({
        error: 'Not authenticated with Puter. Please sign in first.',
        code: 'PUTER_AUTH_REQUIRED',
      });
      return;
    }

    const upstreamPath = req.path.replace('/proxy/v1', '');
    const upstreamUrl = `${config.puterUrl}/puterai/openai/v1${upstreamPath}`;

    try {
      const upstreamRes = await fetch(upstreamUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          Cookie: `puter_auth_token=${record.token}`,
        },
        body:
          req.method !== 'GET' && req.method !== 'HEAD'
            ? JSON.stringify(req.body)
            : undefined,
      });

      if (!upstreamRes.ok) {
        const body = await upstreamRes.text();
        res.status(upstreamRes.status).json({
          error: `Puter upstream error: ${body}`,
        });
        return;
      }

      const contentType = upstreamRes.headers.get('content-type');

      if (contentType?.includes('text/event-stream')) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = upstreamRes.body?.getReader();
        if (!reader) {
          res.status(502).json({ error: 'Empty upstream response body' });
          return;
        }

        const decoder = new TextDecoder();
        let closed = false;

        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (!closed) {
                res.write(decoder.decode(value, { stream: true }));
              }
            }
          } catch {
            if (!closed) {
              res.write(
                `data: ${JSON.stringify({ error: { message: 'stream error' } })}\n\n`,
              );
            }
          } finally {
            if (!closed) {
              res.end();
              closed = true;
            }
          }
        };

        req.on('close', () => {
          closed = true;
          reader.cancel();
        });

        pump();
      } else {
        const body = await upstreamRes.text();
        try {
          res.status(upstreamRes.status).json(JSON.parse(body));
        } catch {
          res.status(upstreamRes.status).send(body);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(502).json({
        error: `Puter proxy error: ${message}`,
      });
    }
  });

  return router;
}