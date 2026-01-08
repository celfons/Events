const pinoHttp = require('pino-http');
const logger = require('./logger');

/**
 * HTTP request logger middleware using pino-http
 * Logs all incoming requests with structured logging
 */
const requestLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration'
  },
  serializers: {
    req: req => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        'x-request-id': req.headers['x-request-id'],
        'user-agent': req.headers['user-agent']
      },
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort
    }),
    res: res => ({
      statusCode: res.statusCode
    })
  }
});

module.exports = requestLogger;
