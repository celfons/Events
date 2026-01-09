const logger = require('../../logging/logger');
const { ErrorResponse } = require('../dto/ErrorResponse');

/**
 * Centralized exception handler middleware for Express
 * Handles all uncaught errors in the application and provides consistent error responses
 * with request correlation via requestId
 *
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function exceptionHandler(err, req, res, next) {
  // Get requestId from the request object (set by requestIdMiddleware)
  const requestId = req.requestId;

  // Log the error with request correlation
  logger.error(
    {
      err,
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip
    },
    'Unhandled exception'
  );

  // Create error response
  const errorResponse = ErrorResponse.internalError('Internal server error');
  const responseBody = errorResponse.toJSON();

  // Add requestId to response body for correlation
  responseBody.requestId = requestId;

  // Send response with both header and body containing requestId
  res.status(errorResponse.status).json(responseBody);
}

module.exports = exceptionHandler;
