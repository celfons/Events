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
      date: new Date('2026-12-31'),
      location: 'Test Location',
      maxParticipants: 50,
      organizerId: userId
    });
    eventId = event.id;
  });

  describe('POST /api/registrations', () => {
    it('should register a participant for an event', async () => {
      const registrationData = {
        eventId: eventId,
        participantName: 'John Doe',
        participantEmail: 'john@example.com'
      };

      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.participantName).toBe('John Doe');
      expect(response.body.participantEmail).toBe('john@example.com');
      expect(response.body.status).toBe('confirmed');

      // Verify the event has the registration
      const event = await eventRepository.findById(eventId);
      expect(event.registrations).toHaveLength(1);
      expect(event.registrations[0].participantEmail).toBe('john@example.com');
    });

    it('should return 400 for missing required fields', async () => {
      const registrationData = {
        eventId: eventId
        // Missing participantName and participantEmail
      };

      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid event id', async () => {
      const registrationData = {
        eventId: 'invalid-id',
        participantName: 'John Doe',
        participantEmail: 'john@example.com'
      };

      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent event', async () => {
      const registrationData = {
        eventId: '507f1f77bcf86cd799439011',
        participantName: 'John Doe',
        participantEmail: 'john@example.com'
      };

      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when event is full', async () => {
      // Create event with only 1 spot
      const fullEvent = await eventRepository.create({
        title: 'Full Event',
        description: 'Description',
        date: new Date('2026-12-31'),
        location: 'Location',
        maxParticipants: 1,
        organizerId: userId,
        registrations: [
          {
            participantName: 'Existing Participant',
            participantEmail: 'existing@example.com',
            registrationDate: new Date(),
            status: 'confirmed'
          }
        ]
      });

      const registrationData = {
        eventId: fullEvent.id,
        participantName: 'John Doe',
        participantEmail: 'john@example.com'
      };

      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('full');
    });

    it('should return 400 when participant is already registered', async () => {
      // Register once
      const registrationData = {
        eventId: eventId,
        participantName: 'John Doe',
        participantEmail: 'john@example.com'
      };

      await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(201);

      // Try to register again with same email
      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already registered');
    });

    it('should return 400 for invalid email format', async () => {
      const registrationData = {
        eventId: eventId,
        participantName: 'John Doe',
        participantEmail: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/registrations/:id/cancel', () => {
    it('should cancel a registration', async () => {
      // First, create a registration
      const registrationData = {
        eventId: eventId,
        participantName: 'John Doe',
        participantEmail: 'john@example.com'
      };

      const createResponse = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(201);

      const registrationId = createResponse.body.id;

      // Cancel the registration
      const response = await request(app)
        .post(`/api/registrations/${registrationId}/cancel`)
        .send({ eventId: eventId })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('cancelled');

      // Verify the registration status is updated
      const event = await eventRepository.findById(eventId);
      const registration = event.registrations.find(r => r.id === registrationId);
      expect(registration.status).toBe('cancelled');
    });

    it('should return 400 for invalid registration id', async () => {
      const response = await request(app)
        .post('/api/registrations/invalid-id/cancel')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for non-existent registration', async () => {
      const response = await request(app)
        .post('/api/registrations/507f1f77bcf86cd799439011/cancel')
        .send({ eventId: eventId })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when trying to cancel already cancelled registration', async () => {
      // Create and cancel a registration
      const registrationData = {
        eventId: eventId,
        participantName: 'John Doe',
        participantEmail: 'john@example.com'
      };

      const createResponse = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(201);

      const registrationId = createResponse.body.id;

      await request(app)
        .post(`/api/registrations/${registrationId}/cancel`)
        .send({ eventId: eventId })
        .expect(200);

      // Try to cancel again
      const response = await request(app)
        .post(`/api/registrations/${registrationId}/cancel`)
        .send({ eventId: eventId })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already cancelled');
    });
  });

  describe('Integration with Events', () => {
    it('should update event participant count after registration', async () => {
      // Get initial event state
      const eventBefore = await eventRepository.findById(eventId);
      expect(eventBefore.registrations).toHaveLength(0);

      // Register a participant
      await request(app)
        .post('/api/registrations')
        .send({
          eventId: eventId,
          participantName: 'John Doe',
          participantEmail: 'john@example.com'
        })
        .expect(201);

      // Check event state after registration
      const eventAfter = await eventRepository.findById(eventId);
      expect(eventAfter.registrations).toHaveLength(1);
      expect(eventAfter.registrations[0].participantEmail).toBe('john@example.com');
      expect(eventAfter.registrations[0].status).toBe('confirmed');
    });

    it('should update event participant count after cancellation', async () => {
      // Register a participant
      const createResponse = await request(app)
        .post('/api/registrations')
        .send({
          eventId: eventId,
          participantName: 'John Doe',
          participantEmail: 'john@example.com'
        })
        .expect(201);

      const registrationId = createResponse.body.id;

      // Verify registration exists
      let event = await eventRepository.findById(eventId);
      expect(event.registrations).toHaveLength(1);
      expect(event.registrations[0].status).toBe('confirmed');

      // Cancel the registration
      await request(app)
        .post(`/api/registrations/${registrationId}/cancel`)
        .send({ eventId: eventId })
        .expect(200);

      // Verify registration is cancelled (not removed)
      event = await eventRepository.findById(eventId);
      expect(event.registrations).toHaveLength(1);
      expect(event.registrations[0].status).toBe('cancelled');
    });

    it('should prevent registration when event reaches max capacity', async () => {
      // Create event with capacity of 2
      const limitedEvent = await eventRepository.create({
        title: 'Limited Event',
        description: 'Description',
        date: new Date('2026-12-31'),
        location: 'Location',
        maxParticipants: 2,
        organizerId: userId
      });

      // Register first participant
      await request(app)
        .post('/api/registrations')
        .send({
          eventId: limitedEvent.id,
          participantName: 'John Doe',
          participantEmail: 'john@example.com'
        })
        .expect(201);

      // Register second participant
      await request(app)
        .post('/api/registrations')
        .send({
          eventId: limitedEvent.id,
          participantName: 'Jane Doe',
          participantEmail: 'jane@example.com'
        })
        .expect(201);

      // Try to register third participant (should fail)
      const response = await request(app)
        .post('/api/registrations')
        .send({
          eventId: limitedEvent.id,
          participantName: 'Bob Smith',
          participantEmail: 'bob@example.com'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('full');
    });
  });
});
