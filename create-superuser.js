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

    // Create superuser
    const superuser = new UserModel({
      username: 'admin',
      email: 'admin@events.com',
      password: 'admin123', // This will be hashed automatically by the pre-save hook
      role: 'superuser'
    });

    await superuser.save();

    console.log('Superuser created successfully:');
    console.log(`  Username: ${superuser.username}`);
    console.log(`  Email: ${superuser.email}`);
    console.log(`  Password: admin123`);
    console.log('\nIMPORTANT: Please change the password after first login!');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating superuser:', error);
    process.exit(1);
  }
}

createSuperuser();
