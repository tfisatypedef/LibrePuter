import express from 'express';
import { createPuterProxyRouter } from './puterProxy';

export interface StandaloneServerOptions {
  port: number;
  puterUrl: string;
  librechatUrl?: string;
}

export function createStandaloneServer(options: StandaloneServerOptions) {
  const app = express();
  app.use(express.json());

  const puterRouter = createPuterProxyRouter({
    puterUrl: options.puterUrl,
    librechatUrl: options.librechatUrl ?? '',
  });

  app.use('/api/puter', puterRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', puterUrl: options.puterUrl });
  });

  return app;
}

// Start if run directly
if (require.main === module) {
  const port = parseInt(process.env.LIBREPUTER_PORT || '3090', 10);
  const puterUrl = process.env.PUTER_URL || 'http://localhost:4100';
  const librechatUrl = process.env.LIBRECHAT_URL || 'http://localhost:3080';

  const app = createStandaloneServer({ port, puterUrl, librechatUrl });

  app.listen(port, () => {
    console.log(`[LibrePuter] Standalone proxy running on port ${port}`);
    console.log(`[LibrePuter] Proxying to Puter at: ${puterUrl}`);
    console.log(`[LibrePuter] API available at: http://localhost:${port}/api/puter`);
  });
}