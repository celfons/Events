const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const databaseConnection = require('../../infrastructure/database/connection');
const {
  clearMockRepositories,
  getMockUserRepository,
  getMockEventRepository,
} = require('./mock-repositories');

let mongoServer;
let usingExternalMongo = false;
let usingMocks = false;

/**
 * Setup MongoDB for testing
 * Attempts to use mongodb-memory-server, then external MongoDB, finally falls back to mocks
 */
async function setupTestDB() {
  try {
    // Try to start in-memory MongoDB server with timeout
    const createPromise = MongoMemoryServer.create({
      binary: {
        downloadDir:
          process.env.MONGODB_DOWNLOAD_DIR ||
          './node_modules/.cache/mongodb-memory-server/mongodb-binaries',
      },
    });

    // Timeout after 5 seconds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('MongoDB Memory Server timeout')), 5000)
    );

    mongoServer = await Promise.race([createPromise, timeoutPromise]);
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await databaseConnection.connect(mongoUri);
    console.log('✅ Using mongodb-memory-server');
    usingMocks = false;

    // Clear database at setup
    await clearDatabase();
    return;
  } catch {
    // Try external MongoDB with shorter timeout
    console.warn('⚠️  mongodb-memory-server failed, trying external MongoDB');
    usingExternalMongo = true;

    try {
      const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/events-test';

      // Only connect if not already connected - with timeout
      if (!databaseConnection.isConnected()) {
        const connectPromise = databaseConnection.connect(mongoUri);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('External MongoDB timeout')), 3000)
        );

        await Promise.race([connectPromise, timeoutPromise]);
      }
      console.log('✅ Using external MongoDB');
      usingMocks = false;

      // Clear database at setup
      await clearDatabase();
      return;
    } catch {
      // Both in-memory and external MongoDB failed, use mocks
      console.warn('⚠️  External MongoDB also failed, using mocks for tests');
      usingMocks = true;
      setupMocks();
    }
  }
}

/**
 * Setup mocks for MongoDB operations when database is not available
 */
function setupMocks() {
  // Mock mongoose connection
  if (!mongoose.connection.readyState) {
    mongoose.connection.readyState = 1; // Connected state
  }

  // Mock the collections object
  if (!mongoose.connection.collections) {
    mongoose.connection.collections = {};
  }

  // Prevent mongoose from actually trying to connect
  const databaseConnection = require('../../infrastructure/database/connection');
  databaseConnection.isConnected = () => true;
  databaseConnection.connect = async () => ({ connection: { readyState: 1 } });
  databaseConnection.disconnect = async () => {};
}

/**
 * Clear all collections in the database or reset mocks
 */
async function clearDatabase() {
  if (usingMocks) {
    // Clear mock repositories
    clearMockRepositories();

    // Reset mocks if using mock mode
    if (typeof jest !== 'undefined') {
      jest.clearAllMocks();
    }
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
    if (usingMocks) {
      // Clean up mocks
      if (typeof jest !== 'undefined') {
        jest.restoreAllMocks();
      }
      return;
    }

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
 * Check if tests are running in mock mode
 */
function isUsingMocks() {
  return usingMocks;
}

/**
 * Get appropriate repository based on test mode
 * Returns mock repository if in mock mode, otherwise returns real repository
 */
function getTestRepository(RepositoryClass) {
  if (usingMocks) {
    // Return mock repository based on class name
    if (RepositoryClass.name.includes('User')) {
      return getMockUserRepository();
    } else if (RepositoryClass.name.includes('Event')) {
      return getMockEventRepository();
    }
    throw new Error(`Unknown repository type: ${RepositoryClass.name}`);
  }
  return new RepositoryClass();
}

module.exports = {
  setupTestDB,
  clearDatabase,
  teardownTestDB,
  isUsingMocks,
  getTestRepository,
};
