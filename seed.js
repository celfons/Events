require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const EventModel = require('./src/infrastructure/database/EventModel');
const UserModel = require('./src/infrastructure/database/UserModel');
const GroupModel = require('./src/infrastructure/database/GroupModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/events';

const sampleEvents = [
  {
    title: 'Workshop: Introdução ao Node.js',
    description: 'Aprenda os fundamentos do Node.js e construa sua primeira API REST. Inclui hands-on com Express e MongoDB.',
    dateTime: new Date('2024-02-15T14:00:00'),
    totalSlots: 30,
    availableSlots: 30
  },
  {
    title: 'Meetup: JavaScript Moderno',
    description: 'Discussão sobre as últimas features do ES2024, incluindo decorators, records e tuples.',
    dateTime: new Date('2024-02-20T19:00:00'),
    totalSlots: 50,
    availableSlots: 50
  },
  {
    title: 'Curso: MongoDB e Clean Architecture',
    description: 'Como estruturar aplicações Node.js com MongoDB seguindo princípios de Clean Architecture e SOLID.',
    dateTime: new Date('2024-02-25T09:00:00'),
    totalSlots: 25,
    availableSlots: 25
  },
  {
    title: 'Hackathon: Desenvolvimento Fullstack',
    description: 'Maratona de 24 horas para desenvolver uma aplicação completa com Node.js, React e MongoDB.',
    dateTime: new Date('2024-03-01T08:00:00'),
    totalSlots: 40,
    availableSlots: 40
  },
  {
    title: 'Workshop: Bootstrap 5 e Design Responsivo',
    description: 'Aprenda a criar interfaces modernas e responsivas com Bootstrap 5, incluindo componentes customizados.',
    dateTime: new Date('2024-03-05T15:00:00'),
    totalSlots: 35,
    availableSlots: 35
  }
];

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Seed Admin Group
    console.log('🗑️  Clearing existing groups...');
    await GroupModel.deleteMany({});
    console.log('✅ Existing groups cleared');

    console.log('🌱 Creating admin group...');
    const adminGroup = await GroupModel.create({
      name: 'Administradores',
      description: 'Grupo de administradores com acesso total ao sistema',
      permissions: ['events:create', 'events:update', 'events:delete', 'users:manage', 'groups:manage']
    });
    console.log('✅ Admin group created successfully');

    // Seed Admin User
    console.log('🗑️  Clearing existing users...');
    await UserModel.deleteMany({});
    console.log('✅ Existing users cleared');

    console.log('🌱 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await UserModel.create({
      username: 'admin',
      email: 'admin@events.com',
      password: hashedPassword,
      groups: [adminGroup._id],
      isActive: true
    });
    console.log('✅ Admin user created successfully');
    console.log(`   Username: admin`);
    console.log(`   Password: admin123`);
    console.log(`   Email: admin@events.com`);

    // Seed Events
    console.log('🗑️  Clearing existing events...');
    await EventModel.deleteMany({});
    console.log('✅ Existing events cleared');

    console.log('🌱 Seeding sample events...');
    // Add createdBy to each event
    const eventsWithUser = sampleEvents.map(event => ({
      ...event,
      createdBy: adminUser._id
    }));
    await EventModel.insertMany(eventsWithUser);
    console.log('✅ Sample events created successfully');

    const count = await EventModel.countDocuments();
    console.log(`📊 Total events in database: ${count}`);

    console.log('\n📋 Sample Events:');
    const events = await EventModel.find().sort({ dateTime: 1 });
    events.forEach((event, index) => {
      console.log(`\n${index + 1}. ${event.title}`);
      console.log(`   ID: ${event._id}`);
      console.log(`   Date: ${event.dateTime.toLocaleDateString('pt-BR')}`);
      console.log(`   Slots: ${event.availableSlots}/${event.totalSlots}`);
    });

    console.log('\n✨ Database seeded successfully!');
    console.log('\n🔐 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   URL: http://localhost:3000/login');
    console.log('\n🚀 You can now start the application with: npm start');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

seedDatabase();
