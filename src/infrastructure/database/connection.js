const mongoose = require('mongoose');

class DatabaseConnection {
  constructor() {
    this.connection = null;
  }

  async connect(uri) {
    try {
      this.connection = await mongoose.connect(uri);
      console.log('✅ Connected to MongoDB successfully');
      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new DatabaseConnection();
