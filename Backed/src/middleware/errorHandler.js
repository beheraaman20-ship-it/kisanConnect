import { ZodError } from 'zod';
import { ApiError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details },
    });
  }

  if (err instanceof ApiError) {
    const body = { success: false, error: { code: err.code, message: err.message } };
    if (err.details) body.error.details = err.details;
    if (err.statusCode === 500) logger.error(err);
    return res.status(err.statusCode).json(body);
  }

  logger.error('Unhandled error', err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
  });
}