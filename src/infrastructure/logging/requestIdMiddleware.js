const crypto = require('crypto');

/**
 * Middleware to generate or extract request ID from headers
 * Adds the request ID to both the request object and response headers
 */
function requestIdMiddleware(req, res, next) {
  // Get request ID from header or generate a new one
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();

  // Add request ID to request object
  req.requestId = requestId;

  // Add request ID to response headers
  res.setHeader('x-request-id', requestId);

  next();
}

module.exports = requestIdMiddleware;
