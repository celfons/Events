require('dotenv').config();
const createApp = require('./app');
const databaseConnection = require('./infrastructure/database/connection');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/events';

async function start() {
  try {
    // Connect to database
    await databaseConnection.connect(MONGODB_URI);

    // Create and start server
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Events page: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await databaseConnection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await databaseConnection.disconnect();
  process.exit(0);
});

start();
