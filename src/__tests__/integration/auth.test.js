const request = require('supertest');
const createApp = require('../../app');
const {
  setupTestDB,
  clearDatabase,
  teardownTestDB,
  isMongoAvailable,
  itIfMongo,
  createDummyApp
} = require('./test-helper');
const MongoUserRepository = require('../../infrastructure/database/MongoUserRepository');

describe('Auth API Integration Tests', () => {
  let app;
  let userRepository;

  beforeAll(async () => {
    await setupTestDB();
    process.env.JWT_SECRET = 'test-secret-key';

    if (!isMongoAvailable()) {
      console.warn('⚠️  Skipping Auth API Integration Tests - MongoDB not available');
      app = createDummyApp();
      return;
    }

    app = createApp();
    userRepository = new MongoUserRepository();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    if (!isMongoAvailable()) return;
    await clearDatabase();
  });

  describe('POST /api/auth/login', () => {
    itIfMongo('should login successfully with valid credentials', async () => {
      // Create a test user
      await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    itIfMongo('should return 401 for invalid credentials', async () => {
      await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid credentials');
    });

    itIfMongo('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid credentials');
    });

    itIfMongo('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Validation failed');
    });

    itIfMongo('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Validation failed');
    });
  });
});
