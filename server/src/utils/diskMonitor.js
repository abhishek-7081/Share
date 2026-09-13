import fs from 'fs';
import { config } from '../config/index.js';
import { logger } from './logger.js';

export async function checkDiskSpace(targetPath = config.uploadDir) {
  try {
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
    if (typeof fs.promises.statfs === 'function') {
      const stats = await fs.promises.statfs(targetPath);
      const freeBytes = stats.bsize * stats.bavail;
      return {
        hasSpace: freeBytes >= config.minDiskSpaceBytes,
        freeBytes,
        totalBytes: stats.bsize * stats.blocks
      };
    }

    // Fallback if statfs is unavailable
    return { hasSpace: true, freeBytes: Number.MAX_SAFE_INTEGER, totalBytes: Number.MAX_SAFE_INTEGER };
  } catch (error) {
    logger.warn('Failed to check disk space', { error: error.message });
    return { hasSpace: true, freeBytes: Number.MAX_SAFE_INTEGER, totalBytes: Number.MAX_SAFE_INTEGER };
  }
}
