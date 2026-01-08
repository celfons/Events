const AppError = require('./AppError');

/**
 * Validation Error
 * Used when input validation fails
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

module.exports = ValidationError;
