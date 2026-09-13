import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class InMemoryStore {
  constructor() {
    this.sessions = new Map(); // sessionId -> data
    this.codeToSession = new Map(); // code -> sessionId
    this.transfers = new Map(); // transferId -> metadata & chunkSet
    this.ttls = new Map(); // key -> NodeJS.Timeout
  }

  async createSession(sessionId, sessionData, code, ttlSeconds = config.sessionExpirySeconds) {
    const data = {
      ...sessionData,
      id: sessionId,
      code,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlSeconds * 1000,
      hostConnected: true,
      guestConnected: false,
      status: 'WAITING'
    };
    
    this.sessions.set(sessionId, data);
    if (code) {
      this.codeToSession.set(code, sessionId);
    }

    this._setTtl(`session:${sessionId}`, ttlSeconds, () => {
      this.deleteSession(sessionId);
    });

    return data;
  }

  async getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      await this.deleteSession(sessionId);
      return null;
    }
    return session;
  }

  async getSessionIdByCode(code) {
    const sessionId = this.codeToSession.get(code);
    if (!sessionId) return null;
    const session = await this.getSession(sessionId);
    if (!session) {
      this.codeToSession.delete(code);
      return null;
    }
    return sessionId;
  }

  async updateSession(sessionId, updates) {
    const session = await this.getSession(sessionId);
    if (!session) return null;
    const updated = { ...session, ...updates, updatedAt: Date.now() };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  async deleteSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && session.code) {
      this.codeToSession.delete(session.code);
    }
    this.sessions.delete(sessionId);
    this._clearTtl(`session:${sessionId}`);
    logger.info('Session deleted/expired', { sessionId });
  }

  async saveTransfer(transferId, transferData, ttlSeconds = config.transferExpirySeconds) {
    const data = {
      ...transferData,
      transferId,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlSeconds * 1000,
      receivedChunks: new Set(transferData.receivedChunks || []),
      status: transferData.status || 'INITIALIZED'
    };
    this.transfers.set(transferId, data);
    
    this._setTtl(`transfer:${transferId}`, ttlSeconds, () => {
      this.deleteTransfer(transferId);
    });

    return data;
  }

  async getTransfer(transferId) {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return null;
    if (Date.now() > transfer.expiresAt) {
      await this.deleteTransfer(transferId);
      return null;
    }
    return transfer;
  }

  async recordChunk(transferId, chunkIndex) {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) return null;
    transfer.receivedChunks.add(chunkIndex);
    transfer.updatedAt = Date.now();
    return Array.from(transfer.receivedChunks);
  }

  async getReceivedChunks(transferId) {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) return [];
    return Array.from(transfer.receivedChunks);
  }

  async updateTransfer(transferId, updates) {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) return null;
    Object.assign(transfer, updates);
    transfer.updatedAt = Date.now();
    return transfer;
  }

  async deleteTransfer(transferId) {
    this.transfers.delete(transferId);
    this._clearTtl(`transfer:${transferId}`);
    logger.info('Transfer removed from store', { transferId });
  }

  async getAllTransfers() {
    return Array.from(this.transfers.values());
  }

  _setTtl(key, seconds, callback) {
    this._clearTtl(key);
    const timer = setTimeout(callback, seconds * 1000);
    this.ttls.set(key, timer);
  }

  _clearTtl(key) {
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
      this.ttls.delete(key);
    }
  }
}

export const store = new InMemoryStore();
