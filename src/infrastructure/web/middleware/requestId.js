const { v4: uuidv4 } = require('uuid');

/**
 * Request ID middleware
 * Adds x-request-id header to each request for tracking
 */
function requestId(req, res, next) {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

module.exports = { requestId };
