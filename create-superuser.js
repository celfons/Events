require('dotenv').config();
const mongoose = require('mongoose');
const UserModel = require('./src/infrastructure/database/UserModel');

async function createSuperuser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/events';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if superuser already exists
    const existingSuperuser = await UserModel.findOne({ role: 'superuser' });
    
    if (existingSuperuser) {
      console.log('A superuser already exists:');
      console.log(`  Username: ${existingSuperuser.username}`);
      console.log(`  Email: ${existingSuperuser.email}`);
      await mongoose.disconnect();
      return;
    }

    // Get password from environment variable or prompt for it
    const password = process.env.SUPERUSER_PASSWORD;
    
    if (!password) {
      console.error('Error: SUPERUSER_PASSWORD environment variable is not set.');
      console.error('Please set it before running this script:');
      console.error('  SUPERUSER_PASSWORD=your_password npm run create-superuser');
      await mongoose.disconnect();
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('Error: Password must be at least 6 characters long.');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Create superuser
    const superuser = new UserModel({
      username: process.env.SUPERUSER_USERNAME || 'admin',
      email: process.env.SUPERUSER_EMAIL || 'admin@events.com',
      password: password, // This will be hashed automatically by the pre-save hook
      role: 'superuser'
    });

    await superuser.save();

    console.log('Superuser created successfully:');
    console.log(`  Username: ${superuser.username}`);
    console.log(`  Email: ${superuser.email}`);
    console.log('\nIMPORTANT: Keep your password secure and do not share it!');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating superuser:', error);
    process.exit(1);
  }
}

createSuperuser();
