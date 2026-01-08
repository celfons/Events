const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const databaseConnection = require('../../infrastructure/database/connection');

let mongoServer;
let usingExternalMongo = false;

/**
 * Setup MongoDB for testing
 * Attempts to use mongodb-memory-server, falls back to external MongoDB if needed
 */
async function setupTestDB() {
  try {
    // Try to start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create({
      binary: {
        downloadDir: process.env.MONGODB_DOWNLOAD_DIR || './node_modules/.cache/mongodb-memory-server/mongodb-binaries'
      }
    });
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await databaseConnection.connect(mongoUri);
    console.log('✅ Using mongodb-memory-server');
  } catch (error) {
    // Fallback to external MongoDB if in-memory server fails
    console.warn('⚠️  mongodb-memory-server failed, using external MongoDB');
    usingExternalMongo = true;
    const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/events-test';

    // Only connect if not already connected
    if (!databaseConnection.isConnected()) {
      await databaseConnection.connect(mongoUri);
    }
  }

  // Clear database at setup
  await clearDatabase();
}

/**
 * Clear all collections in the database
 */
async function clearDatabase() {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

/**
 * Teardown database connection and stop MongoDB server
 */
async function teardownTestDB() {
  try {
    // Clear database before disconnect
    await clearDatabase();

    if (databaseConnection.isConnected()) {
      await databaseConnection.disconnect();
    }

    // Only stop in-memory server if we're using it
    if (mongoServer && !usingExternalMongo) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Failed to teardown test database:', error);
    // Don't throw - allow tests to complete
  }
}

module.exports = {
  setupTestDB,
  clearDatabase,
  teardownTestDB
};
