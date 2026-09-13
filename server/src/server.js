import http from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { SocketManager } from './websocket/socketManager.js';
import { startCleanupWorker } from './services/cleanupWorker.js';

const server = http.createServer(app);
const socketManager = new SocketManager(server);
const stopCleanup = startCleanupWorker();

server.listen(config.port, () => {
  logger.info(`ShareFlow Server listening on port ${config.port}`, {
    env: config.nodeEnv,
    maxFileSize: config.maxFileSize,
    maxChunkSize: config.maxChunkSize
  });
});

// Graceful Shutdown Handler
function gracefulShutdown(signal) {
  logger.warn(`Received ${signal}. Initiating graceful shutdown...`);
  
  stopCleanup();
  
  // Close HTTP & WebSocket server
  server.close(() => {
    logger.info('HTTP server closed.');
    socketManager.close();
    logger.info('WebSocket manager closed. Exiting process.');
    process.exit(0);
  });

  // Force exit after 10 seconds if connections hang
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { server, socketManager };
