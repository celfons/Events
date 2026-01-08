require('dotenv').config();
const createApp = require('./app');
const databaseConnection = require('./infrastructure/database/connection');
const logger = require('./infrastructure/logging/logger');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/events';

async function start() {
  try {
    // Connect to database
    await databaseConnection.connect(MONGODB_URI);

    // Create and start server
    const app = createApp();
    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'Server running');
      logger.info({ url: `http://localhost:${PORT}` }, 'Events page available');
      logger.info({ url: `http://localhost:${PORT}/health` }, 'Health check available');
      logger.info({ url: `http://localhost:${PORT}/api-docs` }, 'API Documentation available');
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await databaseConnection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await databaseConnection.disconnect();
  process.exit(0);
});

start();
