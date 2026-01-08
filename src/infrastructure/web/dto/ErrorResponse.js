/**
 * Error codes for standardized error responses
 */
const ErrorCodes = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Conflict errors (409)
  CONFLICT: 'CONFLICT',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',

  // Server errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
};

/**
 * ErrorResponse DTO
 * Standardized error response structure
 */
class ErrorResponse {
  /**
   * @param {number} status - HTTP status code
   * @param {string} code - Error code from ErrorCodes
   * @param {string} message - Human-readable error message
   * @param {Array|Object} [details] - Optional additional error details
   * @param {string} [requestId] - Optional request ID for correlation
   */
  constructor(status, code, message, details = null, requestId = null) {
    this.status = status;
    this.code = code;
    this.message = message;
    if (details) {
      this.details = details;
    }
    if (requestId) {
      this.requestId = requestId;
    }
    this.timestamp = new Date().toISOString();
  }

  /**
   * Convert to plain object for JSON response
   */
  toJSON() {
    const response = {
      error: {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp
      }
    };

    if (this.requestId) {
      response.error.requestId = this.requestId;
    }

    if (this.details) {
      response.error.details = this.details;
    }

    return response;
  }

  // Static factory methods for common errors

  static validationError(details) {
    return new ErrorResponse(400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', details);
  }

  static invalidInput(message = 'Invalid input data') {
    return new ErrorResponse(400, ErrorCodes.INVALID_INPUT, message);
  }

  static unauthorized(message = 'Authentication required') {
    return new ErrorResponse(401, ErrorCodes.UNAUTHORIZED, message);
  }

  static invalidCredentials(message = 'Invalid credentials') {
    return new ErrorResponse(401, ErrorCodes.INVALID_CREDENTIALS, message);
  }

  static invalidToken(message = 'Invalid or expired token') {
    return new ErrorResponse(401, ErrorCodes.TOKEN_INVALID, message);
  }

  static forbidden(message = 'Access denied') {
    return new ErrorResponse(403, ErrorCodes.FORBIDDEN, message);
  }

  static insufficientPermissions(message = 'Insufficient permissions') {
    return new ErrorResponse(403, ErrorCodes.INSUFFICIENT_PERMISSIONS, message);
  }

  static notFound(message = 'Resource not found') {
    return new ErrorResponse(404, ErrorCodes.NOT_FOUND, message);
  }

  static conflict(message = 'Resource conflict') {
    return new ErrorResponse(409, ErrorCodes.CONFLICT, message);
  }

  static internalError(message = 'Internal server error') {
    return new ErrorResponse(500, ErrorCodes.INTERNAL_SERVER_ERROR, message);
  }
}

module.exports = { ErrorResponse, ErrorCodes };
