import { logger } from '../utils/logger.js';

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString()
  });
}

/**
 * Global error handler
 */
export function errorHandler(err, req, res, next) {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log the error
  logger.error('Unhandled error in request', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    requestId: req.requestId,
    userAgent: req.headers['user-agent']
  });

  // Determine error response
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal server error';

  // Handle known error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Request validation failed';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Authentication failed';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
    message = 'Access denied';
  } else if (err.message?.includes('rate limit')) {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
    message = 'Rate limit exceeded';
  } else if (err.message?.includes('timeout')) {
    statusCode = 408;
    errorCode = 'REQUEST_TIMEOUT';
    message = 'Request timeout';
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    code: errorCode,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    // Include error details for debugging (temporarily include in production)
    details: err.message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack
    })
  });
}