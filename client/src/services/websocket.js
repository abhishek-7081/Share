class WebSocketClient {
  constructor() {
    this.ws = null;
    this.url = null;
    this.sessionId = null;
    this.role = null;
    this.listeners = new Map();
    this.stateListeners = new Set();
    this.connectionState = 'DISCONNECTED';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.pingTimer = null;
  }

  connect(sessionId, role = 'guest') {
    this.sessionId = sessionId;
    this.role = role;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.url = `${protocol}//${host}/ws`;

    this._initSocket();
  }

  _setConnectionState(newState) {
    this.connectionState = newState;
    this.stateListeners.forEach(cb => cb(newState));
  }

  _initSocket() {
    if (this.ws) {
      this.ws.close();
    }

    this._setConnectionState(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this._setConnectionState('CONNECTED');
        
        // Handshake & Join Session
        this.send('JOIN_SESSION', {
          sessionId: this.sessionId,
          role: this.role
        });

        this._startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'PONG') return;
          
          this._emit(message.type, message.payload || message);
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      this.ws.onclose = () => {
        this._stopHeartbeat();
        this._setConnectionState('DISCONNECTED');
        this._scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.warn('WebSocket error:', error);
      };
    } catch (e) {
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this._setConnectionState('FAILED');
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;
    
    setTimeout(() => {
      if (this.connectionState !== 'CONNECTED' && this.sessionId) {
        this._initSocket();
      }
    }, delay);
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('PING', {});
      }
    }, 25000);
  }

  _stopHeartbeat() {
    if (this.pingTimer) clearInterval(this.pingTimer);
  }

  send(type, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
    return () => this.listeners.get(type).delete(callback);
  }

  onStateChange(callback) {
    this.stateListeners.add(callback);
    callback(this.connectionState);
    return () => this.stateListeners.delete(callback);
  }

  _emit(type, data) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(cb => cb(data));
    }
  }

  disconnect() {
    this._stopHeartbeat();
    this.sessionId = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._setConnectionState('DISCONNECTED');
  }
}

export const wsClient = new WebSocketClient();
