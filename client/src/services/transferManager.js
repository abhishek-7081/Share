import { api } from './api.js';
import { computeBufferHash } from './chunker.js';
import { idbStorage } from './idbStorage.js';
import { wsClient } from './websocket.js';

export class TransferUploader {
  constructor(file, sessionId, chunkSize = 2 * 1024 * 1024, onProgress, onError, onComplete) {
    this.file = file;
    this.sessionId = sessionId;
    this.chunkSize = chunkSize;
    this.totalChunks = Math.ceil(file.size / chunkSize);
    this.onProgress = onProgress;
    this.onError = onError;
    this.onComplete = onComplete;

    this.transferId = null;
    this.isPaused = false;
    this.isCancelled = false;
    this.startTime = null;
    this.uploadedBytes = 0;
    this.lastSpeedCheck = Date.now();
    this.lastBytesCheck = 0;
    this.currentSpeed = 0;
  }

  async start() {
    try {
      // 1. Initialize transfer metadata on backend
      const initRes = await api.createTransfer({
        sessionId: this.sessionId,
        fileName: this.file.name,
        fileSize: this.file.size,
        mimeType: this.file.type || 'application/octet-stream',
        totalChunks: this.totalChunks,
        chunkSize: this.chunkSize
      });

      this.transferId = initRes.transferId;
      this.startTime = Date.now();

      // Emit WS signal to peer
      wsClient.send('TRANSFER_INIT', {
        transferId: this.transferId,
        fileName: this.file.name,
        fileSize: this.file.size,
        totalChunks: this.totalChunks,
        mimeType: this.file.type
      });

      await this.uploadChunks([]);
    } catch (error) {
      if (this.onError) this.onError(error);
    }
  }

  async resume() {
    if (!this.transferId) return this.start();
    this.isPaused = false;
    
    // Query server for already received chunks
    try {
      const status = await api.getTransferStatus(this.transferId);
      await this.uploadChunks(status.receivedChunks || []);
    } catch (e) {
      await this.uploadChunks([]);
    }
  }

  pause() {
    this.isPaused = true;
  }

  async cancel() {
    this.isCancelled = true;
    if (this.transferId) {
      try {
        await api.cancelTransfer(this.transferId);
        await idbStorage.clearTransferState(this.transferId);
      } catch (e) {
        // Ignore
      }
    }
  }

  async uploadChunks(alreadyUploadedIndices = []) {
    const uploadedSet = new Set(alreadyUploadedIndices);
    this.uploadedBytes = uploadedSet.size * this.chunkSize;

    for (let i = 0; i < this.totalChunks; i++) {
      if (this.isCancelled) return;
      
      while (this.isPaused) {
        await new Promise(r => setTimeout(r, 300));
        if (this.isCancelled) return;
      }

      if (uploadedSet.has(i)) continue;

      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, this.file.size);
      const chunkBlob = this.file.slice(start, end);
      const arrayBuffer = await chunkBlob.arrayBuffer();

      // Calculate chunk SHA-256
      let chunkHash = '';
      try {
        chunkHash = await computeBufferHash(arrayBuffer.slice(0));
      } catch (e) {
        // Fallback if hash worker fails
      }

      // Upload chunk with retry mechanism
      await this.uploadChunkWithRetry(i, arrayBuffer, chunkHash);

      uploadedSet.add(i);
      this.uploadedBytes += (end - start);

      // Save state to IndexedDB for client crash recovery
      await idbStorage.saveTransferState(this.transferId, {
        fileName: this.file.name,
        receivedChunks: Array.from(uploadedSet)
      });

      // Calculate speed and ETA
      const now = Date.now();
      const timeDiff = (now - this.lastSpeedCheck) / 1000;
      if (timeDiff >= 1.0) {
        const bytesDiff = (end - start);
        this.currentSpeed = bytesDiff / timeDiff;
        this.lastSpeedCheck = now;
      }

      const progress = Math.min(100, Math.round((uploadedSet.size / this.totalChunks) * 100));
      const remainingBytes = this.file.size - this.uploadedBytes;
      const eta = this.currentSpeed > 0 ? remainingBytes / this.currentSpeed : 0;

      if (this.onProgress) {
        this.onProgress({
          progress,
          uploadedBytes: this.uploadedBytes,
          totalBytes: this.file.size,
          speed: this.currentSpeed,
          eta,
          currentChunk: i + 1,
          totalChunks: this.totalChunks
        });
      }

      // Notify peer via WS progress signal
      wsClient.send('TRANSFER_PROGRESS', {
        transferId: this.transferId,
        progress,
        uploadedBytes: this.uploadedBytes,
        totalBytes: this.file.size
      });
    }

    // Finalize file SHA-256 on backend
    try {
      const finalRes = await api.finalizeTransfer(this.transferId);
      await idbStorage.clearTransferState(this.transferId);

      wsClient.send('TRANSFER_COMPLETE', {
        transferId: this.transferId,
        fileName: this.file.name,
        fileSize: this.file.size,
        fileHash: finalRes.transfer.fileHash
      });

      if (this.onComplete) this.onComplete(finalRes.transfer);
    } catch (err) {
      if (this.onError) this.onError(err);
    }
  }

  async uploadChunkWithRetry(chunkIndex, arrayBuffer, chunkHash, maxRetries = 5) {
    let delay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await api.uploadChunk(this.transferId, chunkIndex, arrayBuffer, chunkHash);
        return;
      } catch (err) {
        if (attempt === maxRetries || this.isCancelled) {
          throw err;
        }
        await new Promise(r => setTimeout(r, delay));
        delay *= 1.5; // Exponential backoff
      }
    }
  }
}
