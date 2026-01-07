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
  let mockWhatsAppService;

  beforeAll(async () => {
    await setupTestDB();
    process.env.JWT_SECRET = 'test-secret-key';
    
    // Mock WhatsApp service for integration tests
    mockWhatsAppService = {
      connect: jest.fn().mockResolvedValue(true),
      disconnect: jest.fn().mockResolvedValue(true),
      sendMessage: jest.fn().mockResolvedValue(true)
    };
    
    app = createApp(mockWhatsAppService);
    userRepository = new MongoUserRepository();
    eventRepository = new MongoEventRepository();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Reset mock
    mockWhatsAppService.sendMessage.mockClear();

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
    it('should register a participant for an event with pending status', async () => {
      const registrationData = {
        eventId: eventId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.email).toBe('john@example.com');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data).toHaveProperty('verificationCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('verify');

      // Verify WhatsApp was called
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Verificação de Cadastro')
      );

      // Verify the event has the registration
      const event = await eventRepository.findById(eventId);
      expect(event.participants).toHaveLength(1);
      expect(event.participants[0].email).toBe('john@example.com');
      expect(event.participants[0].status).toBe('pending');
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
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for non-existent event', async () => {
      const registrationData = {
        eventId: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when event is full', async () => {
      // Create event with only 1 spot
      const fullEvent = await eventRepository.create({
        title: 'Full Event',
        description: 'Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 1,
        userId: userId
      });

      // Register and verify the first (and only) participant
      const firstParticipant = await eventRepository.addParticipant(fullEvent.id, {
        name: 'Existing Participant',
        email: 'existing@example.com',
        phone: '+9999999999',
        status: 'active',
        verified: true
      });

      // Try to register a second participant (should fail)
      const registrationData = {
        eventId: fullEvent.id,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('available slots');
    });

    it('should return 400 when participant is already registered', async () => {
      // Register once
      const registrationData = {
        eventId: eventId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
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
        name: 'John Doe',
        email: 'invalid-email',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/registrations/verify', () => {
    it('should verify a registration with valid code', async () => {
      // First, create a registration
      const registrationData = {
        eventId: eventId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const createResponse = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(201);

      const participantId = createResponse.body.data.id;
      const verificationCode = createResponse.body.data.verificationCode;

      // Clear the mock to track only verification message
      mockWhatsAppService.sendMessage.mockClear();

      // Verify the registration
      const verifyResponse = await request(app)
        .post('/api/registrations/verify')
        .send({
          eventId: eventId,
          participantId: participantId,
          verificationCode: verificationCode
        })
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('message');
      expect(verifyResponse.body.message).toContain('confirmed');

      // Verify WhatsApp confirmation was sent
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Inscrição Confirmada')
      );

      // Verify the registration status is updated
      const event = await eventRepository.findById(eventId);
      const registration = event.participants.find(r => r.id === participantId);
      expect(registration.status).toBe('active');
      expect(registration.verified).toBe(true);
    });

    it('should return 400 for invalid verification code', async () => {
      // First, create a registration
      const registrationData = {
        eventId: eventId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const createResponse = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(201);

      const participantId = createResponse.body.data.id;

      // Try to verify with wrong code
      const verifyResponse = await request(app)
        .post('/api/registrations/verify')
        .send({
          eventId: eventId,
          participantId: participantId,
          verificationCode: '000000'
        })
        .expect(400);

      expect(verifyResponse.body).toHaveProperty('error');
      expect(verifyResponse.body.error).toContain('Invalid');
    });

    it('should return 400 when event becomes full before verification', async () => {
      // Create event with only 1 spot
      const limitedEvent = await eventRepository.create({
        title: 'Limited Event',
        description: 'Description',
        dateTime: new Date('2026-12-31'),
        totalSlots: 1,
        userId: userId
      });

      // Register a participant (pending)
      const registrationData = {
        eventId: limitedEvent.id,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const createResponse = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(201);

      const participantId = createResponse.body.data.id;
      const verificationCode = createResponse.body.data.verificationCode;

      // Manually add an active participant to fill the event
      await eventRepository.addParticipant(limitedEvent.id, {
        name: 'Quick Participant',
        email: 'quick@example.com',
        phone: '+9999999999',
        status: 'active',
        verified: true
      });

      // Try to verify (should fail because event is full)
      const verifyResponse = await request(app)
        .post('/api/registrations/verify')
        .send({
          eventId: limitedEvent.id,
          participantId: participantId,
          verificationCode: verificationCode
        })
        .expect(400);

      expect(verifyResponse.body).toHaveProperty('error');
      expect(verifyResponse.body.error).toContain('full');
    });
  });

  describe('POST /api/registrations/:id/cancel', () => {
    it('should cancel an active registration', async () => {
      // First, create and verify a registration
      const registrationData = {
        eventId: eventId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const createResponse = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(201);

      const participantId = createResponse.body.data.id;
      const verificationCode = createResponse.body.data.verificationCode;

      // Verify the registration
      await request(app)
        .post('/api/registrations/verify')
        .send({
          eventId: eventId,
          participantId: participantId,
          verificationCode: verificationCode
        })
        .expect(200);

      // Cancel the registration
      const response = await request(app)
        .post(`/api/registrations/${participantId}/cancel`)
        .send({ eventId: eventId })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('cancelled');

      // Verify the registration status is updated
      const event = await eventRepository.findById(eventId);
      const registration = event.participants.find(r => r.id === participantId);
      expect(registration.status).toBe('cancelled');
    });

    it('should return 400 for invalid registration id', async () => {
      const response = await request(app)
        .post('/api/registrations/invalid-id/cancel')
        .send({ eventId: eventId })
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
      // Create and verify a registration
      const registrationData = {
        eventId: eventId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const createResponse = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(201);

      const participantId = createResponse.body.data.id;
      const verificationCode = createResponse.body.data.verificationCode;

      // Verify the registration
      await request(app)
        .post('/api/registrations/verify')
        .send({
          eventId: eventId,
          participantId: participantId,
          verificationCode: verificationCode
        })
        .expect(200);

      // Cancel the registration
      await request(app)
        .post(`/api/registrations/${participantId}/cancel`)
        .send({ eventId: eventId })
        .expect(200);

      // Try to cancel again
      const response = await request(app)
        .post(`/api/registrations/${participantId}/cancel`)
        .send({ eventId: eventId })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Active registration not found');
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

    it('should update participant status after verification', async () => {
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

      const participantId = createResponse.body.data.id;
      const verificationCode = createResponse.body.data.verificationCode;

      // Verify registration is pending
      let event = await eventRepository.findById(eventId);
      expect(event.participants).toHaveLength(1);
      expect(event.participants[0].status).toBe('pending');

      // Verify the registration
      await request(app)
        .post('/api/registrations/verify')
        .send({
          eventId: eventId,
          participantId: participantId,
          verificationCode: verificationCode
        })
        .expect(200);

      // Verify registration is now active
      event = await eventRepository.findById(eventId);
      expect(event.participants).toHaveLength(1);
      expect(event.participants[0].status).toBe('active');
    });

    it('should update event participant count after cancellation', async () => {
      // Register and verify a participant
      const createResponse = await request(app)
        .post('/api/registrations')
        .send({
          eventId: eventId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        })
        .expect(201);

      const participantId = createResponse.body.data.id;
      const verificationCode = createResponse.body.data.verificationCode;

      await request(app)
        .post('/api/registrations/verify')
        .send({
          eventId: eventId,
          participantId: participantId,
          verificationCode: verificationCode
        })
        .expect(200);

      // Verify registration exists
      let event = await eventRepository.findById(eventId);
      expect(event.participants).toHaveLength(1);
      expect(event.participants[0].status).toBe('active');

      // Cancel the registration
      await request(app)
        .post(`/api/registrations/${participantId}/cancel`)
        .send({ eventId: eventId })
        .expect(200);

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

      // Register and verify first participant
      const firstResponse = await request(app)
        .post('/api/registrations')
        .send({
          eventId: limitedEvent.id,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        })
        .expect(201);

      await request(app)
        .post('/api/registrations/verify')
        .send({
          eventId: limitedEvent.id,
          participantId: firstResponse.body.data.id,
          verificationCode: firstResponse.body.data.verificationCode
        })
        .expect(200);

      // Register and verify second participant
      const secondResponse = await request(app)
        .post('/api/registrations')
        .send({
          eventId: limitedEvent.id,
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+0987654321'
        })
        .expect(201);

      await request(app)
        .post('/api/registrations/verify')
        .send({
          eventId: limitedEvent.id,
          participantId: secondResponse.body.data.id,
          verificationCode: secondResponse.body.data.verificationCode
        })
        .expect(200);

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
      expect(response.body.error).toContain('available slots');
    });
  });
});
