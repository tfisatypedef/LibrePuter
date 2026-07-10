const { Router } = require('express');

const PUTER_AI_BASE = 'https://api.puter.com/puterai';

function createPuterProxyRouter() {
  const router = Router();

  router.get('/models', async (_req, res) => {
    try {
      const response = await fetch(`${PUTER_AI_BASE}/chat/models`);
      if (!response.ok) {
        return res.status(response.status).json({
          error: 'Failed to fetch models from Puter',
        });
      }
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(502).json({ error: `Puter connection failed: ${err.message}` });
    }
  });

  router.get('/models/details', async (_req, res) => {
    try {
      const response = await fetch(`${PUTER_AI_BASE}/chat/models/details`);
      if (!response.ok) {
        return res.status(response.status).json({
          error: 'Failed to fetch model details from Puter',
        });
      }
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(502).json({ error: `Puter connection failed: ${err.message}` });
    }
  });

  router.all('/proxy/v1/{*path}', async (req, res) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid Authorization header.',
        code: 'PUTER_AUTH_REQUIRED',
      });
    }

    const upstreamPath = req.params.path || '';
    const upstreamUrl = `${PUTER_AI_BASE}/openai/v1${upstreamPath ? '/' + upstreamPath : ''}`;

    try {
      const upstreamRes = await fetch(upstreamUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: req.method !== 'GET' && req.method !== 'HEAD'
          ? JSON.stringify(req.body)
          : undefined,
      });

      if (!upstreamRes.ok) {
        const body = await upstreamRes.text();
        return res.status(upstreamRes.status).json({
          error: `Puter upstream error: ${body}`,
        });
      }

      const contentType = upstreamRes.headers.get('content-type');

      if (contentType?.includes('text/event-stream')) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = upstreamRes.body?.getReader();
        if (!reader) {
          return res.status(502).json({ error: 'Empty upstream response body' });
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
    } catch (err) {
      res.status(502).json({
        error: `Puter proxy error: ${err.message}`,
      });
    }
  });

  return router;
}

module.exports = { createPuterProxyRouter };