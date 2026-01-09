const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const databaseConnection = require('../../infrastructure/database/connection');

let mongoServer;
let usingExternalMongo = false;
let mongoAvailable = true;

/**
 * Setup MongoDB for testing
 * Attempts to use mongodb-memory-server, falls back to external MongoDB if needed
 */
async function setupTestDB() {
  try {
    // Try to start in-memory MongoDB server with timeout
    mongoServer = await Promise.race([
      MongoMemoryServer.create({
        binary: {
          downloadDir:
            process.env.MONGODB_DOWNLOAD_DIR || './node_modules/.cache/mongodb-memory-server/mongodb-binaries'
        }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoMemoryServer creation timeout')), 10000))
    ]);
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database with fast-fail timeout
    await databaseConnection.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    console.log('✅ Using mongodb-memory-server');
    mongoAvailable = true;
  } catch (error) {
    // Fallback to external MongoDB if in-memory server fails
    console.warn('⚠️  mongodb-memory-server failed, attempting external MongoDB');
    usingExternalMongo = true;
    const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/events-test';

    try {
      // Only connect if not already connected, with fast-fail timeout
      if (!databaseConnection.isConnected()) {
        await databaseConnection.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000
        });
        console.log('✅ Using external MongoDB');
        mongoAvailable = true;
      }
    } catch (connectError) {
      console.error('❌ MongoDB is not available:', connectError.message);
      console.warn('⚠️  Skipping integration tests - MongoDB required');
      mongoAvailable = false;
      // Don't throw - let tests skip gracefully
      return;
    }
  }

  // Clear database at setup (only if connected)
  if (mongoAvailable && databaseConnection.isConnected()) {
    await clearDatabase();
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

    // Only stop in-memory server if we're using it
    if (mongoServer && !usingExternalMongo) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Failed to teardown test database:', error);
    // Don't throw - allow tests to complete
  }
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
  isMongoAvailable: () => mongoAvailable,
  itIfMongo
};
