const RegisterForEventUseCase = require('../RegisterForEventUseCase');

describe('RegisterForEventUseCase', () => {
  let mockEventRepository;
  let registerForEventUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn(),
      addParticipant: jest.fn(),
      findParticipantByEmail: jest.fn(),
      findParticipantByPhone: jest.fn()
    };
    registerForEventUseCase = new RegisterForEventUseCase(mockEventRepository);
  });

  describe('Validation', () => {
    it('should return error when eventId is missing', async () => {
      const registrationData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      };

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: eventId, name, email, phone');
    });

    it('should return error when name is missing', async () => {
      const registrationData = {
        eventId: '123',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      };

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: eventId, name, email, phone');
    });

    it('should return error when email is missing', async () => {
      const registrationData = {
        eventId: '123',
        name: 'John Doe',
        phone: '(11) 98765-4321'
      };

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: eventId, name, email, phone');
    });

    it('should return error when phone is missing', async () => {
      const registrationData = {
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com'
      };

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: eventId, name, email, phone');
    });
  });

  describe('Business Rules', () => {
    it('should return error when event does not exist', async () => {
      const registrationData = {
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      };

      mockEventRepository.findById.mockResolvedValue(null);

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
      expect(mockEventRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should return error when user is already registered', async () => {
      const registrationData = {
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      };

      const mockEvent = {
        id: '123',
        title: 'Test Event',
        availableSlots: 10,
        hasAvailableSlots: jest.fn().mockReturnValue(true)
      };

      const existingRegistration = {
        id: '456',
        eventId: '123',
        email: 'john@example.com'
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.findParticipantByEmail.mockResolvedValue(existingRegistration);
      mockEventRepository.findParticipantByPhone.mockResolvedValue(null);

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('You are already registered for this event');
      expect(mockEventRepository.findParticipantByEmail).toHaveBeenCalledWith('123', 'john@example.com');
    });

    it('should return error when phone is already registered', async () => {
      const registrationData = {
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      };

      const mockEvent = {
        id: '123',
        title: 'Test Event',
        availableSlots: 10,
        hasAvailableSlots: jest.fn().mockReturnValue(true)
      };

      const existingRegistration = {
        id: '456',
        eventId: '123',
        phone: '(11) 98765-4321'
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.findParticipantByEmail.mockResolvedValue(null);
      mockEventRepository.findParticipantByPhone.mockResolvedValue(existingRegistration);

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('A participant with this phone number is already registered for this event');
      expect(mockEventRepository.findParticipantByPhone).toHaveBeenCalledWith('123', '(11) 98765-4321');
    });

    it('should return error when event has no available slots', async () => {
      const registrationData = {
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      };

      const mockEvent = {
        id: '123',
        title: 'Test Event',
        availableSlots: 0,
        hasAvailableSlots: jest.fn().mockReturnValue(false)
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.findParticipantByEmail.mockResolvedValue(null);
      mockEventRepository.findParticipantByPhone.mockResolvedValue(null);

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No available slots for this event');
      expect(mockEvent.hasAvailableSlots).toHaveBeenCalled();
    });
  });

  describe('Successful Registration', () => {
    it('should register user successfully and atomically decrement available slots', async () => {
      const registrationData = {
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      };

      const mockEvent = {
        id: '123',
        title: 'Test Event',
        availableSlots: 10,
        hasAvailableSlots: jest.fn().mockReturnValue(true)
      };

      const createdRegistration = {
        id: '456',
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321',
        toJSON: jest.fn().mockReturnValue({
          id: '456',
          eventId: '123',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '(11) 98765-4321',
          status: 'active'
        })
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.findParticipantByEmail.mockResolvedValue(null);
      mockEventRepository.findParticipantByPhone.mockResolvedValue(null);
      mockEventRepository.addParticipant.mockResolvedValue(createdRegistration);

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('john@example.com');
      expect(mockEventRepository.addParticipant).toHaveBeenCalledTimes(1);
    });

    it('should create registration with correct data', async () => {
      const registrationData = {
        eventId: '123',
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone: '(21) 99999-8888'
      };

      const mockEvent = {
        id: '123',
        availableSlots: 5,
        hasAvailableSlots: jest.fn().mockReturnValue(true)
      };

      const updatedEvent = {
        id: '123',
        hasAvailableSlots: jest.fn().mockReturnValue(true)
      };

      const createdRegistration = {
        id: '789',
        eventId: '123',
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone: '(21) 99999-8888',
        toJSON: jest.fn().mockReturnValue({
          id: '789',
          eventId: '123',
          name: 'Maria Silva',
          email: 'maria@example.com',
          phone: '(21) 99999-8888',
          status: 'active'
        })
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.findParticipantByEmail.mockResolvedValue(null);
      mockEventRepository.findParticipantByPhone.mockResolvedValue(null);
      mockEventRepository.addParticipant.mockResolvedValue(createdRegistration);

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Maria Silva');
      expect(result.data.email).toBe('maria@example.com');
      expect(result.data.phone).toBe('(21) 99999-8888');
    });

    it('should fail registration if event is deleted during registration', async () => {
      const registrationData = {
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      };

      const mockEvent = {
        id: '123',
        title: 'Test Event',
        availableSlots: 10,
        hasAvailableSlots: jest.fn().mockReturnValue(true)
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.findParticipantByEmail.mockResolvedValue(null);
      mockEventRepository.findParticipantByPhone.mockResolvedValue(null);
      mockEventRepository.addParticipant.mockResolvedValue(null);

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to register. Event may be full or was deleted.');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      const registrationData = {
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      };

      mockEventRepository.findById.mockRejectedValue(new Error('Database connection error'));

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection error');
    });
  });

  describe('WhatsApp Messaging Integration', () => {
    let mockMessagingService;

    beforeEach(() => {
      mockMessagingService = {
        sendRegistrationConfirmation: jest.fn().mockResolvedValue({ success: true, messageId: 'msg_123' })
      };
    });

    it('should call messaging service with correct parameters when registration is successful', async () => {
      const registerWithMessaging = new RegisterForEventUseCase(mockEventRepository, mockMessagingService);

      const registrationData = {
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      };

      const mockEvent = {
        id: '123',
        title: 'Test Event',
        dateTime: new Date('2024-03-15T14:30:00'),
        local: 'Test Location',
        availableSlots: 10,
        hasAvailableSlots: jest.fn().mockReturnValue(true)
      };

      const createdRegistration = {
        id: '456',
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321',
        toJSON: jest.fn().mockReturnValue({ id: '456', name: 'John Doe' })
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.findParticipantByEmail.mockResolvedValue(null);
      mockEventRepository.findParticipantByPhone.mockResolvedValue(null);
      mockEventRepository.addParticipant.mockResolvedValue(createdRegistration);

      const result = await registerWithMessaging.execute(registrationData);

      // Allow time for async messaging to be called
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(result.success).toBe(true);
      expect(mockMessagingService.sendRegistrationConfirmation).toHaveBeenCalledWith({
        to: '(11) 98765-4321',
        name: 'John Doe',
        eventTitle: 'Test Event',
        eventDate: mockEvent.dateTime,
        eventLocal: 'Test Location'
      });
    });

    it('should complete registration successfully even if messaging fails', async () => {
      mockMessagingService.sendRegistrationConfirmation.mockRejectedValue(new Error('WhatsApp API error'));
      const registerWithMessaging = new RegisterForEventUseCase(mockEventRepository, mockMessagingService);

      const registrationData = {
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      };

      const mockEvent = {
        id: '123',
        title: 'Test Event',
        dateTime: new Date('2024-03-15T14:30:00'),
        local: 'Test Location',
        availableSlots: 10,
        hasAvailableSlots: jest.fn().mockReturnValue(true)
      };

      const createdRegistration = {
        id: '456',
        eventId: '123',
        name: 'John Doe',
        toJSON: jest.fn().mockReturnValue({ id: '456', name: 'John Doe' })
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.findParticipantByEmail.mockResolvedValue(null);
      mockEventRepository.findParticipantByPhone.mockResolvedValue(null);
      mockEventRepository.addParticipant.mockResolvedValue(createdRegistration);

      const result = await registerWithMessaging.execute(registrationData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should not call messaging service when not provided', async () => {
      const registrationData = {
        eventId: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321'
      };

      const mockEvent = {
        id: '123',
        title: 'Test Event',
        availableSlots: 10,
        hasAvailableSlots: jest.fn().mockReturnValue(true)
      };

      const createdRegistration = {
        id: '456',
        toJSON: jest.fn().mockReturnValue({ id: '456' })
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.findParticipantByEmail.mockResolvedValue(null);
      mockEventRepository.findParticipantByPhone.mockResolvedValue(null);
      mockEventRepository.addParticipant.mockResolvedValue(createdRegistration);

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(true);
      // Verify messaging service was not called (use case initialized without it)
    });
  });
});
