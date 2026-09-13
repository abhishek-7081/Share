import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { checkDiskSpace } from '../utils/diskMonitor.js';

export class StorageService {
  static getTempFilePath(transferId) {
    return path.join(config.uploadDir, `${transferId}.tmp`);
  }

  static getFinalFilePath(transferId, fileName) {
    // Sanitize filename to prevent path traversal
    const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9_.\-]/g, '_');
    return path.join(config.uploadDir, `${transferId}_${safeName}`);
  }

  static async ensureStorageDir() {
    if (!fs.existsSync(config.uploadDir)) {
      await fs.promises.mkdir(config.uploadDir, { recursive: true });
    }
  }

  static async saveChunk({ transferId, chunkIndex, chunkSize, chunkBuffer, expectedChunkHash }) {
    await this.ensureStorageDir();

    // Verify disk space first
    const disk = await checkDiskSpace();
    if (!disk.hasSpace) {
      const err = new Error('Server disk space is critically low. Cannot accept uploads.');
      err.statusCode = 503;
      throw err;
    }

    // Verify per-chunk checksum
    if (expectedChunkHash) {
      const computedHash = crypto.createHash('sha256').update(chunkBuffer).digest('hex');
      if (computedHash.toLowerCase() !== expectedChunkHash.toLowerCase()) {
        const err = new Error(`Checksum mismatch for chunk index ${chunkIndex}`);
        err.statusCode = 400;
        throw err;
      }
    }

    const filePath = this.getTempFilePath(transferId);
    const offset = chunkIndex * chunkSize;

    // Write chunk directly at target byte offset without buffering entire file in memory
    const fileHandle = await fs.promises.open(filePath, 'a+');
    try {
      await fileHandle.write(chunkBuffer, 0, chunkBuffer.length, offset);
    } finally {
      await fileHandle.close();
    }

    return true;
  }

  static async verifyAndFinalizeFile(transferId, fileName, expectedFileHash) {
    const tempPath = this.getTempFilePath(transferId);
    if (!fs.existsSync(tempPath)) {
      throw new Error(`Temporary file for transfer ${transferId} not found.`);
    }

    // Perform stream hashing to avoid loading entire file into RAM
    const hash = crypto.createHash('sha256');
    const readStream = fs.createReadStream(tempPath);

    await new Promise((resolve, reject) => {
      readStream.on('data', (chunk) => hash.update(chunk));
      readStream.on('end', resolve);
      readStream.on('error', reject);
    });

    const computedFileHash = hash.digest('hex');

    if (expectedFileHash && computedFileHash.toLowerCase() !== expectedFileHash.toLowerCase()) {
      logger.error('Final file hash mismatch', { transferId, expectedFileHash, computedFileHash });
      await this.cleanupFile(transferId);
      const err = new Error('File integrity verification failed. Transferred file SHA-256 hash mismatch.');
      err.statusCode = 422;
      throw err;
    }

    const finalPath = this.getFinalFilePath(transferId, fileName);
    await fs.promises.rename(tempPath, finalPath);

    logger.info('File verified and finalized successfully', { transferId, finalPath, hash: computedFileHash });
    return { finalPath, fileHash: computedFileHash };
  }

  static async cleanupFile(transferId, fileName = null) {
    try {
      const tempPath = this.getTempFilePath(transferId);
      if (fs.existsSync(tempPath)) {
        await fs.promises.unlink(tempPath);
      }
      if (fileName) {
        const finalPath = this.getFinalFilePath(transferId, fileName);
        if (fs.existsSync(finalPath)) {
          await fs.promises.unlink(finalPath);
        }
      }
    } catch (error) {
      logger.warn('Failed to cleanup transfer files', { transferId, error: error.message });
    }
  }
}
