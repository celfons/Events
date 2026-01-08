const { z } = require('zod');
const { ErrorResponse } = require('../dto');

/**
 * Validation middleware factory
 * Creates middleware to validate request data against a Zod schema
 *
 * @param {Object} schemas - Object containing schemas for different parts of the request
 * @param {z.ZodSchema} schemas.body - Schema for request body
 * @param {z.ZodSchema} schemas.params - Schema for URL parameters
 * @param {z.ZodSchema} schemas.query - Schema for query parameters
 * @returns {Function} Express middleware function
 */
function validate(schemas) {
  return async (req, res, next) => {
    try {
      // Validate body if schema is provided
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // Validate params if schema is provided
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      // Validate query if schema is provided
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format validation errors for better readability
        const formattedErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        const errorResponse = ErrorResponse.validationError(formattedErrors);
        return res.status(errorResponse.status).json(errorResponse.toJSON());
      }

      // Pass other errors to error handler
      next(error);
    }
  };
}

module.exports = validate;
