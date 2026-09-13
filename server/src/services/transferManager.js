import crypto from 'crypto';
import { store } from './storeProvider.js';
import { StorageService } from './storageService.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class TransferManager {
  static async createTransfer({ sessionId, fileName, fileSize, mimeType, totalChunks, chunkSize, fileHash, isText, textContent }) {
    if (fileSize > config.maxFileSize) {
      const err = new Error(`File size exceeds maximum allowed limit of ${config.maxFileSize} bytes.`);
      err.statusCode = 413;
      throw err;
    }

    const session = await store.getSession(sessionId);
    if (!session) {
      const err = new Error('Session not found or expired.');
      err.statusCode = 404;
      throw err;
    }

    const transferId = crypto.randomUUID();
    const transferData = {
      sessionId,
      fileName: fileName || (isText ? 'shared-text.txt' : 'file.bin'),
      fileSize: fileSize || 0,
      mimeType: mimeType || (isText ? 'text/plain' : 'application/octet-stream'),
      totalChunks: totalChunks || 1,
      chunkSize: chunkSize || config.maxChunkSize,
      fileHash,
      isText: !!isText,
      textContent: textContent || null,
      status: isText ? 'COMPLETED' : 'IN_PROGRESS',
      receivedChunks: isText ? [0] : []
    };

    const transfer = await store.saveTransfer(transferId, transferData);
    logger.info('Transfer initialized', { transferId, sessionId, fileName, fileSize });
    return transfer;
  }

  static async getTransfer(transferId) {
    const transfer = await store.getTransfer(transferId);
    if (!transfer) {
      const err = new Error('Transfer not found or expired.');
      err.statusCode = 404;
      throw err;
    }
    return transfer;
  }

  static async recordChunk(transferId, chunkIndex, chunkSize, chunkBuffer, expectedChunkHash) {
    const transfer = await this.getTransfer(transferId);

    if (transfer.status === 'COMPLETED') {
      return { status: 'COMPLETED', receivedChunks: Array.from(transfer.receivedChunks) };
    }

    await StorageService.saveChunk({
      transferId,
      chunkIndex,
      chunkSize: transfer.chunkSize,
      chunkBuffer,
      expectedChunkHash
    });

    const receivedChunks = await store.recordChunk(transferId, chunkIndex);
    const progress = Math.min(100, Math.round((receivedChunks.length / transfer.totalChunks) * 100));

    logger.debug('Chunk recorded', { transferId, chunkIndex, progress });

    return {
      transferId,
      chunkIndex,
      receivedCount: receivedChunks.length,
      totalChunks: transfer.totalChunks,
      progress,
      receivedChunks
    };
  }

  static async finalizeTransfer(transferId, fileHash) {
    const transfer = await this.getTransfer(transferId);

    if (transfer.isText) {
      await store.updateTransfer(transferId, { status: 'COMPLETED' });
      return transfer;
    }

    const { finalPath, fileHash: verifiedHash } = await StorageService.verifyAndFinalizeFile(
      transferId,
      transfer.fileName,
      fileHash || transfer.fileHash
    );

    const updated = await store.updateTransfer(transferId, {
      status: 'COMPLETED',
      finalPath,
      fileHash: verifiedHash
    });

    return updated;
  }

  static async cancelTransfer(transferId) {
    const transfer = await store.getTransfer(transferId);
    if (transfer) {
      await store.updateTransfer(transferId, { status: 'CANCELLED' });
      await StorageService.cleanupFile(transferId, transfer.fileName);
    }
  }
}
