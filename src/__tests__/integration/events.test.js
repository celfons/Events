const request = require('supertest');
const createApp = require('../../app');
const { setupTestDB, clearDatabase, teardownTestDB } = require('./test-helper');
const MongoUserRepository = require('../../infrastructure/database/MongoUserRepository');
const MongoEventRepository = require('../../infrastructure/database/MongoEventRepository');

describe('Events API Integration Tests', () => {
  let app;
  let userRepository;
  let eventRepository;
  let authToken;
  let userId;
  let superuserToken;
  let superuserId;

  beforeAll(async () => {
    await setupTestDB();
    process.env.JWT_SECRET = 'test-secret-key';
    app = createApp();
    userRepository = new MongoUserRepository();
    eventRepository = new MongoEventRepository();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create a regular test user and login
    const user = await userRepository.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    });
    userId = user.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    authToken = loginResponse.body.token;

    // Create a superuser and login
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
  });

  describe('GET /api/events', () => {
    it('should return empty array when no events exist', async () => {
      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all events', async () => {
      // Create test events
      await eventRepository.create({
        title: 'Event 1',
        description: 'Description 1',
        dateTime: new Date('2026-12-31'),
        totalSlots: 50,
        userId: userId
      });

      await eventRepository.create({
        title: 'Event 2',
        description: 'Description 2',
        dateTime: new Date('2026-12-31'),
        totalSlots: 100,
        userId: userId
      });

      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('description');
      expect(response.body[0]).toHaveProperty('dateTime');
      expect(response.body[0]).toHaveProperty('totalSlots');
    });
  });

  describe('POST /api/events', () => {
    it('should create a new event with valid data', async () => {
      const eventData = {
        title: 'New Event',
        description: 'New Event Description',
        dateTime: '2026-12-31T00:00:00.000Z',
        totalSlots: 50
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(eventData.title);
      expect(response.body.description).toBe(eventData.description);
      expect(response.body.totalSlots).toBe(eventData.totalSlots);
      expect(response.body.userId).toBe(userId);
      expect(response.body.participants).toEqual([]);
    });

    it('should return 401 when no auth token is provided', async () => {
      const eventData = {
        title: 'New Event',
        description: 'New Event Description',
        dateTime: '2026-12-31T00:00:00.000Z',
        totalSlots: 50
      };

      await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(401);
    });

    it('should return 400 for invalid event data', async () => {
      const eventData = {
        title: '', // Invalid: empty title
        description: 'Description',
        dateTime: '2026-12-31T00:00:00.000Z',
        totalSlots: 50
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/events/:id', () => {
    it('should get event details by id', async () => {
      const event = await eventRepository.create({
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 50,
        userId: userId
      });

      const response = await request(app)
        .get(`/api/events/${event.id}`)
        .expect(200);

      expect(response.body.event.id).toBe(event.id);
      expect(response.body.event.title).toBe('Test Event');
      expect(response.body.event.description).toBe('Test Description');
          });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/events/507f1f77bcf86cd799439011')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for invalid event id', async () => {
      const response = await request(app)
        .get('/api/events/invalid-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update event when user is the organizer', async () => {
      const event = await eventRepository.create({
        title: 'Original Event',
        description: 'Original Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 50,
        userId: userId
      });

      const updatedData = {
        title: 'Updated Event',
        description: 'Updated Description',
        dateTime: '2027-01-15T00:00:00.000Z'
      };

      const response = await request(app)
        .put(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.title).toBe('Updated Event');
      expect(response.body.description).toBe('Updated Description');
    });

    it('should return 401 when no auth token is provided', async () => {
      const event = await eventRepository.create({
        title: 'Event',
        description: 'Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 50,
        userId: userId
      });

      await request(app)
        .put(`/api/events/${event.id}`)
        .send({ title: 'Updated' })
        .expect(401);
    });

    it('should return 400 when user is not the organizer', async () => {
      // Create event with superuser as organizer
      const event = await eventRepository.create({
        title: 'Event',
        description: 'Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 50,
        userId: superuserId
      });

      // Try to update with regular user token
      const response = await request(app)
        .put(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for non-existent event', async () => {
      const response = await request(app)
        .put('/api/events/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete event when user is the organizer', async () => {
      const event = await eventRepository.create({
        title: 'Event to Delete',
        description: 'Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 50,
        userId: userId
      });

      const response = await request(app)
        .delete(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify event is deleted
      await request(app)
        .get(`/api/events/${event.id}`)
        .expect(404);
    });

    it('should return 401 when no auth token is provided', async () => {
      const event = await eventRepository.create({
        title: 'Event',
        description: 'Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 50,
        userId: userId
      });

      await request(app)
        .delete(`/api/events/${event.id}`)
        .expect(401);
    });

    it('should return 400 when user is not the organizer', async () => {
      const event = await eventRepository.create({
        title: 'Event',
        description: 'Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 50,
        userId: superuserId
      });

      const response = await request(app)
        .delete(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/events/my-events', () => {
    it('should return events created by authenticated user', async () => {
      // Create events for different users
      await eventRepository.create({
        title: 'User Event',
        description: 'Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 50,
        userId: userId
      });

      await eventRepository.create({
        title: 'Superuser Event',
        description: 'Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 50,
        userId: superuserId
      });

      const response = await request(app)
        .get('/api/events/my-events')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('User Event');
      expect(response.body[0].userId).toBe(userId);
    });

    it('should return 401 when no auth token is provided', async () => {
      await request(app)
        .get('/api/events/my-events')
        .expect(401);
    });
  });

  describe('GET /api/events/:id/participants', () => {
    it('should return list of participants for an event', async () => {
      const event = await eventRepository.create({
        title: 'Event',
        description: 'Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 50,
        userId: userId
      });

      // Manually add participants using the repository method
      await eventRepository.addParticipant(event.id, {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        status: 'active'
      });

      await eventRepository.addParticipant(event.id, {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+0987654321',
        status: 'active'
      });

      const response = await request(app)
        .get(`/api/events/${event.id}/participants`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).toHaveProperty('phone');
      expect(response.body[0]).toHaveProperty('status');
    });

    it('should return empty array for event with no participants', async () => {
      const event = await eventRepository.create({
        title: 'Event',
        description: 'Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 50,
        userId: userId
      });

      const response = await request(app)
        .get(`/api/events/${event.id}/participants`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/events/507f1f77bcf86cd799439011/participants')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
