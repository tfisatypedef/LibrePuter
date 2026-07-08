import { Router } from 'express';

const PUTER_API_BASE = 'https://api.puter.com/puterai/openai/v1';

export function createPuterHostedProxyRouter(): Router {
  const router = Router();

  // Proxy AI requests to Puter's hosted API
  // LibreChat sends Authorization: Bearer <user-puter-auth-token>
  // We forward it as-is to api.puter.com
  router.all('/proxy/v1/*', async (req, res) => {
    const authHeader = req.headers['authorization'] as string;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Missing or invalid Authorization header.',
        code: 'PUTER_AUTH_REQUIRED',
      });
      return;
    }

    const upstreamPath = req.path.replace('/proxy/v1', '');
    const upstreamUrl = `${PUTER_API_BASE}${upstreamPath}`;

    try {
      const upstreamRes = await fetch(upstreamUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
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

  // List available models (public, no auth needed)
  router.get('/models', async (_req, res) => {
    try {
      const response = await fetch(
        'https://api.puter.com/puterai/chat/models',
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

  return router;
}