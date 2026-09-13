import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Unhandled request error', {
    statusCode,
    message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    stack: config.nodeEnv !== 'production' ? err.stack : undefined
  });

  res.status(statusCode).json({
    error: message,
    status: statusCode
  });
}
