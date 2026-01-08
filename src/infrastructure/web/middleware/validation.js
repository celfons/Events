const { ZodError } = require('zod');

/**
 * Validation middleware factory
 * @param {Object} schema - Zod schema to validate against
 * @param {string} source - Where to get the data from ('body', 'params', 'query')
 * @returns {Function} Express middleware
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      req[source] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      next(error);
    }
  };
}

module.exports = { validate };
