require('dotenv').config();
const mongoose = require('mongoose');
const UserModel = require('./src/infrastructure/database/UserModel');

async function createDefaultUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/events';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if default user already exists
    const existingUser = await UserModel.findOne({ email: 'user@events.com' });
    
    if (existingUser) {
      console.log('Default user already exists:');
      console.log(`  Username: ${existingUser.username}`);
      console.log(`  Email: ${existingUser.email}`);
      console.log(`  Role: ${existingUser.role}`);
      await mongoose.disconnect();
      return;
    }

    // Create default user with predefined credentials for development
    const defaultUser = new UserModel({
      username: 'user',
      email: 'user@events.com',
      password: 'user123', // This will be hashed automatically by the pre-save hook
      role: 'user'
    });

    await defaultUser.save();

    console.log('Default user created successfully:');
    console.log(`  Username: ${defaultUser.username}`);
    console.log(`  Email: ${defaultUser.email}`);
    console.log(`  Password: user123`);
    console.log(`  Role: ${defaultUser.role}`);
    console.log('\nNOTE: This is a development user. Do not use in production!');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating default user:', error);
    process.exit(1);
  }
}

createDefaultUser();
