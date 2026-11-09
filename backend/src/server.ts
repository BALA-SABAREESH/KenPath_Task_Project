import { createApp } from './app.js';
import { config } from './config/index.js';
import { initDatabase, getDatabaseStatus } from './database/db.js';

const startServer = async () => {
  console.log(`Starting Sweety Backend server in ${config.nodeEnv} mode...`);

  // Initialize Neon database or resilient fallback
  await initDatabase();
  const dbStatus = getDatabaseStatus();
  console.log(`[Database]: Using ${dbStatus.provider} - Connected: ${dbStatus.connected} (${dbStatus.host})`);

  const app = createApp();
  const port = config.port;

  app.listen(port, () => {
    console.log(`✓ Sweety Backend API listening on port ${port}`);
    console.log(`✓ Health endpoint: http://localhost:${port}/api/health`);
    console.log(`✓ Auth endpoint:   http://localhost:${port}/api/auth/login`);
  });
};

startServer().catch((err) => {
  console.error('Fatal error starting Sweety backend server:', err);
  process.exit(1);
});
