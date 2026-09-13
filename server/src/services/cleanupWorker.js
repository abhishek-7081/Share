import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { store } from './storeProvider.js';
import { logger } from '../utils/logger.js';

export function startCleanupWorker(intervalMs = 60000) {
  logger.info('Starting background storage & session cleanup worker');

  const timer = setInterval(async () => {
    try {
      // 1. Clean expired transfers from memory/store
      const allTransfers = await store.getAllTransfers();
      const now = Date.now();

      for (const t of allTransfers) {
        if (now > t.expiresAt || t.status === 'EXPIRED' || t.status === 'CANCELLED') {
          await store.deleteTransfer(t.transferId);
        }
      }

      // 2. Clean orphaned temporary/stale files on disk
      if (fs.existsSync(config.uploadDir)) {
        const files = await fs.promises.readdir(config.uploadDir);
        for (const file of files) {
          const filePath = path.join(config.uploadDir, file);
          try {
            const stats = await fs.promises.stat(filePath);
            const ageSeconds = (now - stats.mtimeMs) / 1000;

            // Remove files older than transferExpirySeconds (default 1h)
            if (ageSeconds > config.transferExpirySeconds) {
              await fs.promises.unlink(filePath);
              logger.info('Cleaned up stale storage file', { file, ageSeconds });
            }
          } catch (e) {
            // Ignore error per file
          }
        }
      }
    } catch (error) {
      logger.error('Error during cleanup worker cycle', { error: error.message });
    }
  }, intervalMs);

  return () => clearInterval(timer);
}
