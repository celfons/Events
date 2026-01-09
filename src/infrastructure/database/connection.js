const mongoose = require('mongoose');
const logger = require('../logging/logger');

class DatabaseConnection {
  constructor() {
    this.connection = null;
  }

  async connect(uri, options = {}) {
    try {
      this.connection = await mongoose.connect(uri, options);
      logger.info('Connected to MongoDB successfully');
      return this.connection;
    } catch (error) {
      logger.error({ err: error }, 'MongoDB connection error');
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new DatabaseConnection();
