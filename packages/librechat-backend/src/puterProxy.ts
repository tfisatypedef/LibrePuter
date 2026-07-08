import { Router } from 'express';
import { TokenStore } from './tokenStore';
import type { LibrePuterConfig, TokenRecord } from './types';

export function createPuterProxyRouter(config: LibrePuterConfig): Router {
  const router = Router();
  const tokenStore = new TokenStore();

  router.post('/login', async (req, res) => {
    try {
      const { authToken, username, userId } = req.body;

      if (!authToken) {
        res.status(400).json({ error: 'authToken is required' });
        return;
      }

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      tokenStore.set(userId, {
        userId,
        token: authToken,
        username: username ?? 'puter-user',
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      res.json({
        authenticated: true,
        username: username ?? 'puter-user',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      res.status(500).json({ error: message });
    }
  });

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
      token: record.token,
    });
  });

  router.post('/logout', (req, res) => {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    tokenStore.delete(userId);
    res.json({ success: true });
  });

  router.get('/models', async (_req, res) => {
    try {
      const response = await fetch(
        `https://api.puter.com/puterai/chat/models`,
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

  router.get('/models/details', async (_req, res) => {
    try {
      const response = await fetch(
        'https://api.puter.com/puterai/chat/models/details',
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
    const upstreamUrl = `https://api.puter.com/puterai/openai/v1${upstreamPath}`;

    try {
      const upstreamRes = await fetch(upstreamUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${record.token}`,
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