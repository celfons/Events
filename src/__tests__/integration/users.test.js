const request = require('supertest');
const createApp = require('../../app');
const { setupTestDB, clearDatabase, teardownTestDB } = require('./test-helper');
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
    app = createApp();
    userRepository = new MongoUserRepository();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create and login as superuser
    const superuser = await userRepository.create({
      username: 'superuser',
      email: 'superuser@example.com',
      password: 'password123',
      role: 'superuser'
    });
    superuserId = superuser.id;

    const superuserLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'superuser@example.com',
        password: 'password123'
      });
    superuserToken = superuserLoginResponse.body.token;

    // Create and login as regular user
    const regularUser = await userRepository.create({
      username: 'regularuser',
      email: 'regular@example.com',
      password: 'password123',
      role: 'user'
    });
    regularUserId = regularUser.id;

    const regularUserLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'regular@example.com',
        password: 'password123'
      });
    regularUserToken = regularUserLoginResponse.body.token;
  });

  describe('GET /api/users', () => {
    it('should return all users for superuser', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${superuserToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.some(u => u.email === 'superuser@example.com')).toBe(true);
      expect(response.body.some(u => u.email === 'regular@example.com')).toBe(true);
    });

    it('should return 401 when no auth token is provided', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });

    it('should return 403 for regular user', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user as superuser', async () => {
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

      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe('newuser');
      expect(response.body.email).toBe('newuser@example.com');
      expect(response.body.role).toBe('user');
      expect(response.body).not.toHaveProperty('password');

      // Verify user can login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should create user with role user even when superuser role is requested', async () => {
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
      expect(response.body.role).toBe('user');
      
      // However, superusers can update the role after creation
      await request(app)
        .put(`/api/users/${response.body.id}`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .send({ role: 'superuser' })
        .expect(200);
    });

    it('should return 401 when no auth token is provided', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user'
      };

      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(401);
    });

    it('should return 403 for regular user', async () => {
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
    });

    it('should return 400 for missing required fields', async () => {
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
    });

    it('should return 400 for duplicate email', async () => {
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
      expect(response.body.error).toContain('already');
    });

    it('should not validate email format (validation not implemented)', async () => {
      // Note: Email validation is not currently implemented in RegisterUseCase
      // This test documents the current behavior
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
        .expect(201);

      expect(response.body.email).toBe('invalid-email');
    });

    it('should return 400 for short password', async () => {
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
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user as superuser', async () => {
      const updatedData = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.username).toBe('updateduser');
      expect(response.body.email).toBe('updated@example.com');
    });

    it('should update user password as superuser', async () => {
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

      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should update user role as superuser', async () => {
      const updatedData = {
        role: 'superuser'
      };

      const response = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${superuserToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.role).toBe('superuser');
    });

    it('should return 401 when no auth token is provided', async () => {
      await request(app)
        .put(`/api/users/${regularUserId}`)
        .send({ username: 'updated' })
        .expect(401);
    });

    it('should return 403 for regular user', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ username: 'updated' })
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${superuserToken}`)
        .send({ username: 'updated' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid user id', async () => {
      const response = await request(app)
        .put('/api/users/invalid-id')
        .set('Authorization', `Bearer ${superuserToken}`)
        .send({ username: 'updated' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user as superuser', async () => {
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

    it('should return 401 when no auth token is provided', async () => {
      await request(app)
        .delete(`/api/users/${regularUserId}`)
        .expect(401);
    });

    it('should return 403 for regular user', async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${superuserToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid user id', async () => {
      const response = await request(app)
        .delete('/api/users/invalid-id')
        .set('Authorization', `Bearer ${superuserToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authorization', () => {
    it('should allow superuser to manage all users', async () => {
      // List users
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${superuserToken}`)
        .expect(200);

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

    it('should deny regular user from managing users', async () => {
      // List users
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

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
