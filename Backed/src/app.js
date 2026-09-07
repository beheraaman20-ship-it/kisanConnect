import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import { seedIfEmpty } from './config/seed.js';
import { initSocket } from './realtime/socket.js';
import { startJobs, stopJobs } from './jobs/index.js';
import logger from './utils/logger.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'kisanconnect-backend', time: new Date().toISOString() });
  });
  app.use('/api/v1', apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export function createServer() {
  if (env.isDev) seedIfEmpty();
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);
  return server;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const server = createServer();
  server.listen(env.port, () => {
    logger.info(`API server listening on http://localhost:${env.port} (${env.nodeEnv})`);
    logger.info(`Health check: http://localhost:${env.port}/health`);
  });
  startJobs();

  const shutdown = () => {
    logger.info('Shutting down server');
    stopJobs();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}