import { SessionManager } from '../services/sessionManager.js';

export async function createSession(req, res, next) {
  try {
    const clientIp = req.ip || req.socket.remoteAddress;
    const session = await SessionManager.createSession(clientIp);
    res.status(201).json({
      sessionId: session.id,
      code: session.code,
      expiresAt: session.expiresAt,
      status: session.status
    });
  } catch (error) {
    next(error);
  }
}

export async function joinSession(req, res, next) {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Numeric sharing code is required.' });
    }
    const clientIp = req.ip || req.socket.remoteAddress;
    const session = await SessionManager.joinSession(code.trim(), clientIp);
    res.status(200).json({
      sessionId: session.id,
      status: session.status,
      hostConnected: session.hostConnected,
      guestConnected: session.guestConnected
    });
  } catch (error) {
    next(error);
  }
}

export async function getSessionStatus(req, res, next) {
  try {
    const { id } = req.params;
    const session = await SessionManager.getSession(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired.' });
    }
    res.status(200).json({
      sessionId: session.id,
      code: session.code,
      status: session.status,
      hostConnected: session.hostConnected,
      guestConnected: session.guestConnected,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    next(error);
  }
}

export async function closeSession(req, res, next) {
  try {
    const { id } = req.params;
    await SessionManager.closeSession(id);
    res.status(200).json({ message: 'Session closed successfully.' });
  } catch (error) {
    next(error);
  }
}
