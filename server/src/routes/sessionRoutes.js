import express from 'express';
import { createSession, joinSession, getSessionStatus, closeSession } from '../controllers/sessionController.js';
import { createSessionLimiter, joinSessionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/create', createSessionLimiter, createSession);
router.post('/join', joinSessionLimiter, joinSession);
router.get('/:id', getSessionStatus);
router.delete('/:id', closeSession);

export default router;
