import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { createApp } from './backend/src/app.js';
import { initDatabase, getDatabaseStatus } from './backend/src/database/db.js';

async function bootstrap() {
  console.log('--- Initializing Sweety – Blood Glucose Tracker ---');

  // Initialize Neon PostgreSQL or resilient fallback
  await initDatabase();
  const dbStatus = getDatabaseStatus();
  console.log(`[Database]: ${dbStatus.provider} | Connected: ${dbStatus.connected} | Host: ${dbStatus.host}`);

  // Create Express application with all API routes mounted at /api
  const app = createApp();

  const isProd = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT) || 3000;

  if (!isProd) {
    console.log('[Dev]: Mounting Vite middlewares in SPA mode...');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`✓ Sweety server running on port ${port}`);
    console.log(`✓ Web interface available at http://localhost:${port}`);
    console.log(`✓ API endpoints available at http://localhost:${port}/api`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start Sweety server:', err);
  process.exit(1);
});
