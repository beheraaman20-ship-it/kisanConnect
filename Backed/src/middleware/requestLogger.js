import crypto from 'node:crypto';
import logger from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const latency = Date.now() - startedAt;
    const user = req.user ? req.user.id : '-';
    logger.info(
      JSON.stringify({
        requestId,
        user,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        latencyMs: latency,
      }),
    );
  });
  return next();
}