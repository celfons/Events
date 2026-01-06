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

    console.log('🌱 Creating super admin group...');
    const superAdminGroup = await GroupModel.create({
      name: 'Super Administradores',
      description: 'Grupo de super administradores com acesso completo ao sistema',
      permissions: [
        // Event permissions
        'events:create', 
        'events:read', 
        'events:update', 
        'events:delete',
        // User permissions
        'users:create',
        'users:read',
        'users:update',
        'users:delete',
        // Group permissions
        'groups:create',
        'groups:read',
        'groups:update',
        'groups:delete'
      ]
    });
    console.log('✅ Super admin group created successfully');

    console.log('🌱 Creating regular admin group...');
    const adminGroup = await GroupModel.create({
      name: 'Administradores',
      description: 'Grupo de administradores com acesso a eventos',
      permissions: ['events:create', 'events:read', 'events:update', 'events:delete']
    });
    console.log('✅ Admin group created successfully');

    // Seed Admin User
    console.log('🗑️  Clearing existing users...');
    await UserModel.deleteMany({});
    console.log('✅ Existing users cleared');

    console.log('🌱 Creating super admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await UserModel.create({
      username: 'admin',
      email: 'admin@events.com',
      password: hashedPassword,
      groups: [superAdminGroup._id],
      isActive: true
    });
    console.log('✅ Super admin user created successfully');
    console.log(`   Username: admin`);
    console.log(`   Password: admin123`);
    console.log(`   Email: admin@events.com`);
    console.log(`   Groups: Super Administradores`);

    console.log('🌱 Creating regular user...');
    const userPassword = await bcrypt.hash('user123', 10);
    const regularUser = await UserModel.create({
      username: 'user',
      email: 'user@events.com',
      password: userPassword,
      groups: [adminGroup._id],
      isActive: true
    });
    console.log('✅ Regular user created successfully');
    console.log(`   Username: user`);
    console.log(`   Password: user123`);
    console.log(`   Email: user@events.com`);
    console.log(`   Groups: Administradores`);

    // Seed Events
    console.log('🗑️  Clearing existing events...');
    await EventModel.deleteMany({});
    console.log('✅ Existing events cleared');

    console.log('🌱 Seeding sample events...');
    // Add createdBy to each event - first 3 for admin, last 2 for regular user
    const eventsWithAdmin = sampleEvents.slice(0, 3).map(event => ({
      ...event,
      createdBy: adminUser._id
    }));
    const eventsWithUser = sampleEvents.slice(3).map(event => ({
      ...event,
      createdBy: regularUser._id
    }));
    await EventModel.insertMany([...eventsWithAdmin, ...eventsWithUser]);
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
    console.log('\n   Super Admin (Full Permissions):');
    console.log('   - Username: admin');
    console.log('   - Password: admin123');
    console.log('   - Permissions: All (users, groups, events)');
    console.log('\n   Regular User (Event Permissions Only):');
    console.log('   - Username: user');
    console.log('   - Password: user123');
    console.log('   - Permissions: Events only');
    console.log('\n   URL: http://localhost:3000/login');
    console.log('\n🚀 You can now start the application with: npm start');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

seedDatabase();
