export class ApiError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (code, message, details) => new ApiError(400, code, message, details);
export const unauthorized = (message = 'Authentication required') => new ApiError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'Access denied') => new ApiError(403, 'FORBIDDEN', message);
export const notFound = (message = 'Resource not found') => new ApiError(404, 'NOT_FOUND', message);
export const conflict = (code, message) => new ApiError(409, code, message);
export const tooManyRequests = (message = 'Too many requests') => new ApiError(429, 'RATE_LIMITED', message);