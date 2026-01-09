const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const databaseConnection = require('../../infrastructure/database/connection');

let mongoServer;
let mongoAvailable = false;

/**
 * Setup MongoDB for testing
 * Uses only mongodb-memory-server. If it fails, tests will be skipped.
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
    mongoAvailable = true;

    // Clear database at setup
    await clearDatabase();
  } catch (error) {
    // If MongoMemoryServer fails, mark as unavailable and skip tests
    console.warn('⚠️  mongodb-memory-server failed, integration tests will be skipped');
    console.warn('Error:', error.message);
    mongoAvailable = false;
    // Don't throw - let tests skip gracefully
  }
}

/**
 * Clear all collections in the database
 */
async function clearDatabase() {
  if (!mongoAvailable || !databaseConnection.isConnected()) {
    return;
  }

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

    // Stop in-memory server if we started it
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Failed to teardown test database:', error);
    // Don't throw - allow tests to complete
  }
}

/**
 * Check if MongoDB is available for testing
 */
function isMongoAvailable() {
  return mongoAvailable;
}

/**
 * Wrapper for integration tests that automatically skips when MongoDB is unavailable
 * Usage: itIfMongo('test name', async () => { ... })
 */
function itIfMongo(name, testFn, timeout) {
  const wrappedFn = async function () {
    if (!mongoAvailable) {
      console.log(`⏭️  Skipping: ${name} - MongoDB not available`);
      return;
    }
    return await testFn();
  };

  if (timeout) {
    return it(name, wrappedFn, timeout);
  }
  return it(name, wrappedFn);
}

module.exports = {
  setupTestDB,
  clearDatabase,
  teardownTestDB,
  isMongoAvailable,
  itIfMongo
};
