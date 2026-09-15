import { WebSocketServer } from "ws";
import { handleSocketMessage } from "./eventHandlers.js";
import { logger } from "../utils/logger.js";

export class SocketManager {
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.sessionSockets = new Map(); // sessionId -> Set<WebSocket>

    this.wss.on("connection", (ws, req) => {
      ws.isAlive = true;
      ws.sessionId = null;

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (message) => {
        handleSocketMessage(ws, message.toString(), this);
      });

      ws.on("close", () => {
        this.unregisterSocket(ws);
      });

      ws.on("error", (err) => {
        logger.error("WebSocket connection error", { error: err.message });
      });
    });

    // Heartbeat ping loop every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          logger.info("Terminating inactive WebSocket client");
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on("close", () => {
      clearInterval(this.heartbeatInterval);
    });
  }

  registerSocket(sessionId, ws, role) {
    if (!this.sessionSockets.has(sessionId)) {
      this.sessionSockets.set(sessionId, new Set());
    }
    this.sessionSockets.get(sessionId).add(ws);
  }

  unregisterSocket(ws) {
    if (ws.sessionId && this.sessionSockets.has(ws.sessionId)) {
      const sockets = this.sessionSockets.get(ws.sessionId);
      sockets.delete(ws);

      // Notify remaining device of disconnection
      this.broadcastToSession(ws.sessionId, {
        type: "DEVICE_LEFT",
        role: ws.role,
        timestamp: Date.now(),
      });

      if (sockets.size === 0) {
        this.sessionSockets.delete(ws.sessionId);
      }
    }
  }

  broadcastToSession(sessionId, message, excludeSocket = null) {
    const sockets = this.sessionSockets.get(sessionId);
    if (!sockets) return;

    const data = JSON.stringify(message);
    for (const ws of sockets) {
      if (ws !== excludeSocket && ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    }
  }

  close() {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
  }
}
