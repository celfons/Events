const AppError = require('./AppError');

/**
 * Conflict Error
 * Used when a request conflicts with current state (e.g., duplicate resource)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = ConflictError;
