import express from 'express';
import { createPuterProxyRouter } from './puterProxy';
import { createPuterHostedProxyRouter } from './puterHostedProxy';

export type ProxyMode = 'hosted' | 'self-hosted';

export interface StandaloneServerOptions {
  port: number;
  mode: ProxyMode;
  puterUrl?: string;
  librechatUrl?: string;
}

export function createStandaloneServer(options: StandaloneServerOptions) {
  const app = express();
  app.use(express.json());

  if (options.mode === 'hosted') {
    const puterRouter = createPuterHostedProxyRouter();
    app.use('/api/puter', puterRouter);
  } else {
    const puterRouter = createPuterProxyRouter({
      puterUrl: options.puterUrl ?? 'http://localhost:4100',
      librechatUrl: options.librechatUrl ?? '',
    });
    app.use('/api/puter', puterRouter);
  }

  return app;
}

if (require.main === module) {
  const mode = (process.env.LIBREPUTER_MODE || 'hosted') as ProxyMode;
  const port = parseInt(process.env.LIBREPUTER_PORT || '3090', 10);
  const puterUrl = process.env.PUTER_URL || 'http://localhost:4100';
  const librechatUrl = process.env.LIBRECHAT_URL || 'http://localhost:3080';

  const app = createStandaloneServer({ port, mode, puterUrl, librechatUrl });

  app.listen(port, () => {
    console.log(`[LibrePuter] Proxy running on port ${port}`);
    if (mode === 'hosted') {
      console.log(`[LibrePuter] Mode: hosted — proxying to api.puter.com`);
      console.log(`[LibrePuter] Users provide their own Puter auth token as API key`);
    } else {
      console.log(`[LibrePuter] Mode: self-hosted — proxying to Puter at: ${puterUrl}`);
    }
    console.log(`[LibrePuter] API available at: http://localhost:${port}/api/puter`);
  });
}