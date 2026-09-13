import crypto from 'crypto';
import { generateUniqueCode } from './codeGenerator.js';
import { store } from './storeProvider.js';
import { logger } from '../utils/logger.js';

export class SessionManager {
  static async createSession(clientIp) {
    const sessionId = crypto.randomUUID();
    const code = await generateUniqueCode(store);
    
    const session = await store.createSession(sessionId, {
      hostIp: clientIp,
      guestIp: null
    }, code);

    logger.info('Session created', { sessionId, code, clientIp });
    return session;
  }

  static async joinSession(code, clientIp) {
    const sessionId = await store.getSessionIdByCode(code);
    if (!sessionId) {
      const error = new Error('Invalid or expired sharing code.');
      error.statusCode = 404;
      throw error;
    }

    const session = await store.getSession(sessionId);
    if (!session) {
      const error = new Error('Session not found or expired.');
      error.statusCode = 404;
      throw error;
    }

    if (session.status === 'EXPIRED' || session.status === 'COMPLETED') {
      const error = new Error('Session has expired or ended.');
      error.statusCode = 410;
      throw error;
    }

    // Update guest connection details
    const updated = await store.updateSession(sessionId, {
      guestIp: clientIp,
      guestConnected: true,
      status: 'CONNECTED'
    });

    logger.info('Guest joined session', { sessionId, code, clientIp });
    return updated;
  }

  static async getSession(sessionId) {
    return await store.getSession(sessionId);
  }

  static async closeSession(sessionId) {
    await store.deleteSession(sessionId);
  }
}
