import http from 'http';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { initSocket } from './socket/index.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const start = async () => {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    logger.info(`Server listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal) => {
    logger.warn(`${signal} received — shutting down gracefully`);
    server.close(() => process.exit(0));
  };

  ['SIGINT', 'SIGTERM'].forEach((signal) =>
    process.on(signal, () => shutdown(signal)),
  );
};

start().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
