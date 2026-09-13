import fs from 'fs';
import { TransferManager } from '../services/transferManager.js';
import { StorageService } from '../services/storageService.js';
import { logger } from '../utils/logger.js';

export async function createTransfer(req, res, next) {
  try {
    const { sessionId, fileName, fileSize, mimeType, totalChunks, chunkSize, fileHash, isText, textContent } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.' });
    }

    const transfer = await TransferManager.createTransfer({
      sessionId,
      fileName,
      fileSize,
      mimeType,
      totalChunks,
      chunkSize,
      fileHash,
      isText,
      textContent
    });

    res.status(201).json(transfer);
  } catch (error) {
    next(error);
  }
}

export async function uploadChunk(req, res, next) {
  try {
    const { id: transferId } = req.params;
    const chunkIndex = parseInt(req.headers['x-chunk-index'], 10);
    const expectedChunkHash = req.headers['x-chunk-hash'] || null;

    if (isNaN(chunkIndex)) {
      return res.status(400).json({ error: 'x-chunk-index header is required and must be a number.' });
    }

    const chunkBuffer = req.body && Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (chunkBuffer.length === 0) {
      return res.status(400).json({ error: 'Empty chunk payload received.' });
    }

    const result = await TransferManager.recordChunk(
      transferId,
      chunkIndex,
      chunkBuffer.length,
      chunkBuffer,
      expectedChunkHash
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getTransferStatus(req, res, next) {
  try {
    const { id: transferId } = req.params;
    const transfer = await TransferManager.getTransfer(transferId);
    res.status(200).json({
      transferId: transfer.transferId,
      status: transfer.status,
      fileName: transfer.fileName,
      fileSize: transfer.fileSize,
      mimeType: transfer.mimeType,
      totalChunks: transfer.totalChunks,
      receivedChunks: Array.from(transfer.receivedChunks || []),
      isText: transfer.isText,
      textContent: transfer.textContent
    });
  } catch (error) {
    next(error);
  }
}

export async function finalizeTransfer(req, res, next) {
  try {
    const { id: transferId } = req.params;
    const { fileHash } = req.body;
    const transfer = await TransferManager.finalizeTransfer(transferId, fileHash);
    res.status(200).json({
      message: 'Transfer finalized and verified successfully.',
      transfer
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadFile(req, res, next) {
  try {
    const { id: transferId } = req.params;
    const transfer = await TransferManager.getTransfer(transferId);

    if (transfer.isText) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(transfer.textContent);
    }

    if (transfer.status !== 'COMPLETED' || !transfer.finalPath) {
      return res.status(400).json({ error: 'File transfer is not yet finalized or completed.' });
    }

    if (!fs.existsSync(transfer.finalPath)) {
      return res.status(404).json({ error: 'Finalized file not found on server.' });
    }

    const stat = await fs.promises.stat(transfer.finalPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', transfer.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(transfer.fileName)}"`);

    // Handle HTTP Range requests for resumable downloads
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunksize);

      const fileStream = fs.createReadStream(transfer.finalPath, { start, end });
      fileStream.pipe(res);
    } else {
      res.setHeader('Content-Length', fileSize);
      const fileStream = fs.createReadStream(transfer.finalPath);
      fileStream.pipe(res);
    }
  } catch (error) {
    next(error);
  }
}

export async function cancelTransfer(req, res, next) {
  try {
    const { id: transferId } = req.params;
    await TransferManager.cancelTransfer(transferId);
    res.status(200).json({ message: 'Transfer cancelled.' });
  } catch (error) {
    next(error);
  }
}
