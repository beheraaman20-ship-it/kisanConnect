import { ZodError } from 'zod';
import { badRequest } from '../utils/errors.js';

export function validate(schema, { source = 'body' } = {}) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(badRequest('VALIDATION_ERROR', 'Invalid request data', details));
    }
    req[source] = result.data;
    return next();
  };
}