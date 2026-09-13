import { store } from '../services/storeProvider.js';
import { logger } from '../utils/logger.js';

export function handleSocketMessage(ws, message, socketManager) {
  let parsed;
  try {
    parsed = JSON.parse(message);
  } catch (e) {
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON payload.' }));
    return;
  }

  const { type, payload = {} } = parsed;

  switch (type) {
    case 'PING':
      ws.isAlive = true;
      ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      break;

    case 'JOIN_SESSION': {
      const { sessionId, role } = payload; // role: 'host' | 'guest'
      if (!sessionId) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'sessionId is required.' }));
        return;
      }

      socketManager.registerSocket(sessionId, ws, role);
      ws.sessionId = sessionId;
      ws.role = role || 'guest';

      // Notify other participant if present
      socketManager.broadcastToSession(sessionId, {
        type: 'DEVICE_JOINED',
        role: ws.role,
        timestamp: Date.now()
      }, ws);

      ws.send(JSON.stringify({
        type: 'SESSION_CONNECTED',
        sessionId,
        role: ws.role
      }));

      logger.info('Device bound to WebSocket session', { sessionId, role: ws.role });
      break;
    }

    case 'TRANSFER_INIT': {
      // Host or guest initiating transfer offer
      const { sessionId } = ws;
      if (!sessionId) return;

      socketManager.broadcastToSession(sessionId, {
        type: 'TRANSFER_INIT',
        payload
      }, ws);
      break;
    }

    case 'TRANSFER_ACCEPT': {
      const { sessionId } = ws;
      if (!sessionId) return;

      socketManager.broadcastToSession(sessionId, {
        type: 'TRANSFER_ACCEPT',
        payload
      }, ws);
      break;
    }

    case 'CHUNK_ACK': {
      const { sessionId } = ws;
      if (!sessionId) return;

      socketManager.broadcastToSession(sessionId, {
        type: 'CHUNK_ACK',
        payload
      }, ws);
      break;
    }

    case 'TRANSFER_PROGRESS': {
      const { sessionId } = ws;
      if (!sessionId) return;

      socketManager.broadcastToSession(sessionId, {
        type: 'TRANSFER_PROGRESS',
        payload
      }, ws);
      break;
    }

    case 'TRANSFER_COMPLETE': {
      const { sessionId } = ws;
      if (!sessionId) return;

      socketManager.broadcastToSession(sessionId, {
        type: 'TRANSFER_COMPLETE',
        payload
      }, ws);
      break;
    }

    case 'TRANSFER_CANCEL': {
      const { sessionId } = ws;
      if (!sessionId) return;

      socketManager.broadcastToSession(sessionId, {
        type: 'TRANSFER_CANCEL',
        payload
      }, ws);
      break;
    }

    default:
      logger.warn('Unknown WebSocket message type received', { type });
      ws.send(JSON.stringify({ type: 'ERROR', message: `Unknown message type: ${type}` }));
      break;
  }
}
