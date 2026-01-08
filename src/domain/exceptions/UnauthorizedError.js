const AppError = require('./AppError');

/**
 * Unauthorized Error
 * Used when authentication fails or is required
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

module.exports = UnauthorizedError;
