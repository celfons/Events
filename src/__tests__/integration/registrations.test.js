const request = require('supertest');
const createApp = require('../../app');
const { setupTestDB, clearDatabase, teardownTestDB } = require('./test-helper');
const MongoUserRepository = require('../../infrastructure/database/MongoUserRepository');
const MongoEventRepository = require('../../infrastructure/database/MongoEventRepository');

describe('Registrations API Integration Tests', () => {
  let app;
  let userRepository;
  let eventRepository;
  let userId;
  let eventId;

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

    // Create a test user
    const user = await userRepository.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    });
    userId = user.id;

    // Create a test event
    const event = await eventRepository.create({
      title: 'Test Event',
      description: 'Test Description',
      dateTime: new Date('2026-12-31'),
      totalSlots: 50,
      userId: userId
    });
    eventId = event.id;
  });

  describe('POST /api/registrations', () => {
    it('should register a participant for an event', async () => {
      const registrationData = {
        eventId: eventId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const response = await request(app).post('/api/registrations').send(registrationData).expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.email).toBe('john@example.com');
      expect(response.body.data.status).toBe('pending');

      // Verify the event has the registration
      const event = await eventRepository.findById(eventId);
      expect(event.participants).toHaveLength(1);
      expect(event.participants[0].email).toBe('john@example.com');
    });

    it('should return 400 for missing required fields', async () => {
      const registrationData = {
        eventId: eventId
        // Missing participantName and participantEmail
      };

      const response = await request(app).post('/api/registrations').send(registrationData).expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });

    it('should return 400 for invalid event id', async () => {
      const registrationData = {
        eventId: 'invalid-id',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const response = await request(app).post('/api/registrations').send(registrationData).expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });

    it('should return 400 for non-existent event', async () => {
      const registrationData = {
        eventId: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const response = await request(app).post('/api/registrations').send(registrationData).expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });

    it('should return 400 when event is full', async () => {
      // Create event with only 1 spot and register one participant
      const fullEvent = await eventRepository.create({
        title: 'Full Event',
        description: 'Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 1,
        userId: userId
      });

      // Register the first (and only) participant
      await eventRepository.addParticipant(fullEvent.id, {
        name: 'Existing Participant',
        email: 'existing@example.com',
        phone: '+9999999999',
        status: 'confirmed'
      });

      // Try to register a second participant (should fail)
      const registrationData = {
        eventId: fullEvent.id,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const response = await request(app).post('/api/registrations').send(registrationData).expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.message).toContain('available slots');
    });

    it('should return 400 when participant is already registered', async () => {
      // Register once
      const registrationData = {
        eventId: eventId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      await request(app).post('/api/registrations').send(registrationData).expect(201);

      // Try to register again with same email
      const response = await request(app).post('/api/registrations').send(registrationData).expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.message).toContain('already registered');
    });

    it('should allow registration when previous registration has expired verification code', async () => {
      // Register once with expired verification code
      const expiredRegistration = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        status: 'pending',
        verificationCode: '123456',
        verificationCodeExpiresAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago (expired)
      };

      await eventRepository.addParticipant(eventId, expiredRegistration);

      // Try to register again with same email (should succeed since previous is expired)
      const registrationData = {
        eventId: eventId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const response = await request(app).post('/api/registrations').send(registrationData).expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe('john@example.com');
      expect(response.body.data.status).toBe('pending');
    });

    it('should not allow registration when previous registration is confirmed', async () => {
      // Register once with confirmed status
      const confirmedRegistration = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        status: 'confirmed'
      };

      await eventRepository.addParticipant(eventId, confirmedRegistration);

      // Try to register again with same email (should fail)
      const registrationData = {
        eventId: eventId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const response = await request(app).post('/api/registrations').send(registrationData).expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.message).toContain('already registered');
    });

    it('should return 400 for invalid email format', async () => {
      const registrationData = {
        eventId: eventId,
        name: 'John Doe',
        email: 'invalid-email'
      };

      const response = await request(app).post('/api/registrations').send(registrationData).expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });
  });

  describe('POST /api/registrations/:id/cancel', () => {
    it('should cancel a registration', async () => {
      // First, create a registration
      const registrationData = {
        eventId: eventId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const createResponse = await request(app).post('/api/registrations').send(registrationData).expect(201);

      const registrationId = createResponse.body.data.id;

      // Cancel the registration
      const response = await request(app)
        .post(`/api/registrations/${registrationId}/cancel`)
        .send({ eventId: eventId })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('cancelled');

      // Verify the registration status is updated
      const event = await eventRepository.findById(eventId);
      const registration = event.participants.find(r => r.id === registrationId);
      expect(registration.status).toBe('cancelled');
    });

    it('should return 400 for invalid registration id', async () => {
      const response = await request(app)
        .post('/api/registrations/invalid-id/cancel')
        .send({ eventId: eventId })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });

    it('should return 400 for non-existent registration', async () => {
      const response = await request(app)
        .post('/api/registrations/507f1f77bcf86cd799439011/cancel')
        .send({ eventId: eventId })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
    });

    it('should return 400 when trying to cancel already cancelled registration', async () => {
      // Create and cancel a registration
      const registrationData = {
        eventId: eventId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const createResponse = await request(app).post('/api/registrations').send(registrationData).expect(201);

      const registrationId = createResponse.body.data.id;

      await request(app).post(`/api/registrations/${registrationId}/cancel`).send({ eventId: eventId }).expect(200);

      // Try to cancel again
      const response = await request(app)
        .post(`/api/registrations/${registrationId}/cancel`)
        .send({ eventId: eventId })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.message).toContain('Active registration not found');
    });
  });

  describe('Integration with Events', () => {
    it('should update event participant count after registration', async () => {
      // Get initial event state
      const eventBefore = await eventRepository.findById(eventId);
      expect(eventBefore.participants).toHaveLength(0);

      // Register a participant
      await request(app)
        .post('/api/registrations')
        .send({
          eventId: eventId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        })
        .expect(201);

      // Check event state after registration
      const eventAfter = await eventRepository.findById(eventId);
      expect(eventAfter.participants).toHaveLength(1);
      expect(eventAfter.participants[0].email).toBe('john@example.com');
      expect(eventAfter.participants[0].status).toBe('pending');
    });

    it('should update event participant count after cancellation', async () => {
      // Register a participant
      const createResponse = await request(app)
        .post('/api/registrations')
        .send({
          eventId: eventId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        })
        .expect(201);

      const registrationId = createResponse.body.data.id;

      // Verify registration exists
      let event = await eventRepository.findById(eventId);
      expect(event.participants).toHaveLength(1);
      expect(event.participants[0].status).toBe('pending');

      // Cancel the registration
      await request(app).post(`/api/registrations/${registrationId}/cancel`).send({ eventId: eventId }).expect(200);

      // Verify registration is cancelled (not removed)
      event = await eventRepository.findById(eventId);
      expect(event.participants).toHaveLength(1);
      expect(event.participants[0].status).toBe('cancelled');
    });

    it('should prevent registration when event reaches max capacity', async () => {
      // Create event with capacity of 2
      const limitedEvent = await eventRepository.create({
        title: 'Limited Event',
        description: 'Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 2,
        userId: userId
      });

      // Register first participant
      await request(app)
        .post('/api/registrations')
        .send({
          eventId: limitedEvent.id,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        })
        .expect(201);

      // Register second participant
      await request(app)
        .post('/api/registrations')
        .send({
          eventId: limitedEvent.id,
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+0987654321'
        })
        .expect(201);

      // Try to register third participant (should fail)
      const response = await request(app)
        .post('/api/registrations')
        .send({
          eventId: limitedEvent.id,
          name: 'Bob Smith',
          email: 'bob@example.com',
          phone: '+1111111111'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.message).toContain('available slots');
    });
  });
});
