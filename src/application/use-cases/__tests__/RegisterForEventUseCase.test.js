const RegisterForEventUseCase = require('../RegisterForEventUseCase');

describe('RegisterForEventUseCase', () => {
  let mockEventRepository;
  let mockRegistrationRepository;
  let registerForEventUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      decrementAvailableSlots: jest.fn(),
      incrementAvailableSlots: jest.fn()
    };
    mockRegistrationRepository = {
      create: jest.fn(),
      findByEventAndEmail: jest.fn(),
      delete: jest.fn()
    };
    registerForEventUseCase = new RegisterForEventUseCase(
      mockEventRepository,
      mockRegistrationRepository
    );
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
      mockRegistrationRepository.findByEventAndEmail.mockResolvedValue(existingRegistration);

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('You are already registered for this event');
      expect(mockRegistrationRepository.findByEventAndEmail).toHaveBeenCalledWith('123', 'john@example.com');
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
      mockRegistrationRepository.findByEventAndEmail.mockResolvedValue(null);

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

      const updatedEvent = {
        id: '123',
        title: 'Test Event',
        availableSlots: 9
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
      mockRegistrationRepository.findByEventAndEmail.mockResolvedValue(null);
      mockRegistrationRepository.create.mockResolvedValue(createdRegistration);
      mockEventRepository.decrementAvailableSlots.mockResolvedValue(updatedEvent);

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('john@example.com');
      expect(mockRegistrationRepository.create).toHaveBeenCalledTimes(1);
      expect(mockEventRepository.decrementAvailableSlots).toHaveBeenCalledWith('123');
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
        availableSlots: 4
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
      mockRegistrationRepository.findByEventAndEmail.mockResolvedValue(null);
      mockRegistrationRepository.create.mockResolvedValue(createdRegistration);
      mockEventRepository.decrementAvailableSlots.mockResolvedValue(updatedEvent);

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Maria Silva');
      expect(result.data.email).toBe('maria@example.com');
      expect(result.data.phone).toBe('(21) 99999-8888');
    });

    it('should rollback registration if event is deleted during registration', async () => {
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
        toJSON: jest.fn()
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockRegistrationRepository.findByEventAndEmail.mockResolvedValue(null);
      mockRegistrationRepository.create.mockResolvedValue(createdRegistration);
      mockEventRepository.decrementAvailableSlots.mockResolvedValue(null); // Event was deleted
      mockRegistrationRepository.delete.mockResolvedValue(true);

      const result = await registerForEventUseCase.execute(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event was deleted during registration');
      expect(mockRegistrationRepository.delete).toHaveBeenCalledWith('456');
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
});
