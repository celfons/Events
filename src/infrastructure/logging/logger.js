const pino = require('pino');

/**
 * Creates a structured logger instance using Pino
 * Outputs logs in JSON format with support for different log levels
 */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: label => {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Use pretty print in development for readability
  transport:
    process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'
      ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
      : undefined
});

module.exports = logger;
