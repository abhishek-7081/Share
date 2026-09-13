import express from 'express';
import {
  createTransfer,
  uploadChunk,
  getTransferStatus,
  finalizeTransfer,
  downloadFile,
  cancelTransfer
} from '../controllers/transferController.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(apiLimiter);

router.post('/create', createTransfer);
router.post('/:id/chunk', express.raw({ type: '*/*', limit: '50mb' }), uploadChunk);
router.get('/:id/status', getTransferStatus);
router.post('/:id/finalize', finalizeTransfer);
router.get('/:id/download', downloadFile);
router.delete('/:id', cancelTransfer);

export default router;
