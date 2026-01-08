/**
 * Global error handling middleware
 * Standardizes error responses across the application
 */
function errorHandler(err, req, res, _next) {
  // Log error with request context
  req.log.error(
    {
      err,
      requestId: req.id,
      path: req.path,
      method: req.method,
    },
    'Request error'
  );

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';
  const details = err.details || undefined;

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      details,
    },
  });
}

module.exports = { errorHandler };
