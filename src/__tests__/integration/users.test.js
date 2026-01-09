const request = require('supertest');
const createApp = require('../../app');
const { setupTestDB, clearDatabase, teardownTestDB, isMongoAvailable, itIfMongo } = require('./test-helper');
const MongoUserRepository = require('../../infrastructure/database/MongoUserRepository');

describe('Users API Integration Tests', () => {
  let app;
  let userRepository;
  let superuserToken;
  let superuserId;
  let regularUserToken;
  let regularUserId;

  beforeAll(async () => {
    await setupTestDB();
    process.env.JWT_SECRET = 'test-secret-key';

    if (!isMongoAvailable()) {
      console.warn('⚠️  Skipping Users API Integration Tests - MongoDB not available');
      // Create dummy app to prevent errors in tests
      app = { address: () => ({ port: 0 }) };
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

    // Create and login as superuser
    const superuser = await userRepository.create({
      username: 'superuser',
      email: 'superuser@example.com',
      password: 'password123',
      role: 'superuser'
    });
    superuserId = superuser.id;

    const superuserLoginResponse = await request(app).post('/api/auth/login').send({
      email: 'superuser@example.com',
      password: 'password123'
    });
    superuserToken = superuserLoginResponse.body.data.token;

    // Create and login as regular user
    const regularUser = await userRepository.create({
      username: 'regularuser',
      email: 'regular@example.com',
      password: 'password123',
      role: 'user'
    });
    regularUserId = regularUser.id;

    const regularUserLoginResponse = await request(app).post('/api/auth/login').send({
      email: 'regular@example.com',
      password: 'password123'
    });
    regularUserToken = regularUserLoginResponse.body.data.token;
  });

  describe('GET /api/users', () => {
    itIfMongo('should return all users for superuser', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${superuserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.some(u => u.email === 'superuser@example.com')).toBe(true);
      expect(response.body.data.some(u => u.email === 'regular@example.com')).toBe(true);
    });

    itIfMongo('should return 401 when no auth token is provided', async () => {
      await request(app).get('/api/users').expect(401);
    });

    itIfMongo('should return 403 for regular user', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });
  });

  describe('POST /api/users', () => {
    itIfMongo('should create a new user as superuser', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superuserToken}`)
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.username).toBe('newuser');
      expect(response.body.data.email).toBe('newuser@example.com');
      expect(response.body.data.role).toBe('user');
      expect(response.body.data).not.toHaveProperty('password');

      // Verify user can login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('data');
      expect(loginResponse.body.data).toHaveProperty('token');
    });

    itIfMongo('should create user with role user even when superuser role is requested', async () => {
      // Note: RegisterUseCase always creates users with role 'user'
      // Superuser role can only be set via direct database update or separate endpoint
      const userData = {
        username: 'newsuperuser',
        email: 'newsuperuser@example.com',
        password: 'password123',
        role: 'superuser'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superuserToken}`)
        .send(userData)
        .expect(201);

      // Role is always 'user' regardless of what was requested
      expect(response.body.data.role).toBe('user');

      // However, superusers can update the role after creation
      await request(app)
        .put(`/api/users/${response.body.data.id}`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .send({ role: 'superuser' })
        .expect(200);
    });

    itIfMongo('should return 401 when no auth token is provided', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user'
      };

      await request(app).post('/api/users').send(userData).expect(401);
    });

    itIfMongo('should return 403 for regular user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(userData)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });

    itIfMongo('should return 400 for missing required fields', async () => {
      const userData = {
        username: 'newuser'
        // Missing email and password
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superuserToken}`)
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });

    itIfMongo('should return 400 for duplicate email', async () => {
      const userData = {
        username: 'anotheruser',
        email: 'regular@example.com', // Already exists
        password: 'password123',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superuserToken}`)
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.message).toContain('already');
    });

    itIfMongo('should validate email format with Zod', async () => {
      // Email validation is now implemented with Zod schemas
      const userData = {
        username: 'newuser',
        email: 'invalid-email',
        password: 'password123',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superuserToken}`)
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    itIfMongo('should return 400 for short password', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: '123', // Too short
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superuserToken}`)
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });
  });

  describe('PUT /api/users/:id', () => {
    itIfMongo('should update a user as superuser', async () => {
      const updatedData = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.data.username).toBe('updateduser');
      expect(response.body.data.email).toBe('updated@example.com');
    });

    itIfMongo('should update user password as superuser', async () => {
      const updatedData = {
        password: 'newpassword123'
      };

      await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .send(updatedData)
        .expect(200);

      // Verify user can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'regular@example.com',
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('data');
      expect(loginResponse.body.data).toHaveProperty('token');
    });

    itIfMongo('should update user role as superuser', async () => {
      const updatedData = {
        role: 'superuser'
      };

      const response = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.data.role).toBe('superuser');
    });

    itIfMongo('should return 401 when no auth token is provided', async () => {
      await request(app).put(`/api/users/${regularUserId}`).send({ username: 'updated' }).expect(401);
    });

    itIfMongo('should return 403 for regular user', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ username: 'updated' })
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });

    itIfMongo('should return 400 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${superuserToken}`)
        .send({ username: 'updated' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });

    itIfMongo('should return 400 for invalid user id', async () => {
      const response = await request(app)
        .put('/api/users/invalid-id')
        .set('Authorization', `Bearer ${superuserToken}`)
        .send({ username: 'updated' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });
  });

  describe('DELETE /api/users/:id', () => {
    itIfMongo('should delete a user as superuser', async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify user cannot login
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'regular@example.com',
          password: 'password123'
        })
        .expect(401);
    });

    itIfMongo('should return 401 when no auth token is provided', async () => {
      await request(app).delete(`/api/users/${regularUserId}`).expect(401);
    });

    itIfMongo('should return 403 for regular user', async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });

    itIfMongo('should return 400 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${superuserToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });

    itIfMongo('should return 400 for invalid user id', async () => {
      const response = await request(app)
        .delete('/api/users/invalid-id')
        .set('Authorization', `Bearer ${superuserToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });
  });

  describe('Authorization', () => {
    itIfMongo('should allow superuser to manage all users', async () => {
      // List users
      await request(app).get('/api/users').set('Authorization', `Bearer ${superuserToken}`).expect(200);

      // Create user
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superuserToken}`)
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          role: 'user'
        })
        .expect(201);

      // Update user
      await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .send({ username: 'updated' })
        .expect(200);

      // Delete user
      await request(app)
        .delete(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .expect(200);
    });

    itIfMongo('should deny regular user from managing users', async () => {
      // List users
      await request(app).get('/api/users').set('Authorization', `Bearer ${regularUserToken}`).expect(403);

      // Create user
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          role: 'user'
        })
        .expect(403);

      // Update user
      await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ username: 'updated' })
        .expect(403);

      // Delete user
      await request(app)
        .delete(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });
});
