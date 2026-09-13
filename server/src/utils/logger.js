import { config } from '../config/index.js';

class Logger {
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    if (config.nodeEnv === 'production') {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
      });
    }
    const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  info(message, meta = {}) {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message, meta = {}) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message, meta = {}) {
    console.error(this.formatMessage('error', message, meta));
  }

  debug(message, meta = {}) {
    if (config.nodeEnv !== 'production') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

export const logger = new Logger();
