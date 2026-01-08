const AppError = require('./AppError');

/**
 * Forbidden Error
 * Used when user doesn't have permission to access a resource
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

module.exports = ForbiddenError;
