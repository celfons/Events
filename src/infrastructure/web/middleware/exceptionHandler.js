const logger = require('../../logging/logger');
const { AppError } = require('../../../domain/exceptions');
const { ErrorResponse } = require('../dto');

/**
 * Centralized Exception Handler Middleware
 * Handles all errors thrown in the application and returns consistent error responses
 *
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function exceptionHandler(err, req, res, next) {
  // Skip if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Default error values
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal server error';
  let details = null;

  // Handle AppError and its subclasses
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;

    // Include details for validation errors
    if (err.details) {
      details = err.details;
    }

    // Log operational errors as warnings
    logger.warn(
      {
        err: {
          name: err.name,
          message: err.message,
          code: err.code,
          statusCode: err.statusCode,
          details: err.details
        },
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        userId: req.user?.userId
      },
      'Operational error occurred'
    );
  } else {
    // Log unexpected errors as errors (these are programming errors)
    logger.error(
      {
        err: {
          name: err.name,
          message: err.message,
          stack: err.stack
        },
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        userId: req.user?.userId
      },
      'Unexpected error occurred'
    );
  }

  // Create error response
  const errorResponse = new ErrorResponse(statusCode, errorCode, message, details);

  // Send response
  return res.status(statusCode).json(errorResponse.toJSON());
}

module.exports = exceptionHandler;
