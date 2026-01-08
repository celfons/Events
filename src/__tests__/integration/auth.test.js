const request = require('supertest');
const createApp = require('../../app');
const { setupTestDB, clearDatabase, teardownTestDB, getTestRepository } = require('./test-helper');
const MongoUserRepository = require('../../infrastructure/database/MongoUserRepository');

describe('Auth API Integration Tests', () => {
  let app;
  let userRepository;

  beforeAll(async () => {
    await setupTestDB();
    process.env.JWT_SECRET = 'test-secret-key';
    app = createApp();
    userRepository = getTestRepository(MongoUserRepository);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Create a test user
      await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for invalid credentials', async () => {
      await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
