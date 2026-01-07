const mongoose = require('mongoose');
const databaseConnection = require('../../infrastructure/database/connection');

/**
 * Setup MongoDB connection for testing
 * Uses Docker MongoDB instance on localhost:27017
 */
async function setupTestDB() {
  const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/events-test';
  
  // Only connect if not already connected
  if (!databaseConnection.isConnected()) {
    await databaseConnection.connect(mongoUri);
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
 * Teardown database connection
 */
async function teardownTestDB() {
  // Clear database before disconnect
  await clearDatabase();
  
  if (databaseConnection.isConnected()) {
    await databaseConnection.disconnect();
  }
}

module.exports = {
  setupTestDB,
  clearDatabase,
  teardownTestDB
};
