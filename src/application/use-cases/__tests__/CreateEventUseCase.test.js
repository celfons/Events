const CreateEventUseCase = require('../CreateEventUseCase');

describe('CreateEventUseCase', () => {
  let mockEventRepository;
  let createEventUseCase;

  beforeEach(() => {
    mockEventRepository = {
      create: jest.fn()
    };
    createEventUseCase = new CreateEventUseCase(mockEventRepository);
  });

  describe('Validation', () => {
    it('should return error when title is missing', async () => {
      const eventData = {
        description: 'Test Description',
        dateTime: '2024-12-31T14:00:00',
        totalSlots: 50
      };

      const result = await createEventUseCase.execute(eventData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: title, description, dateTime, totalSlots');
      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });

    it('should return error when description is missing', async () => {
      const eventData = {
        title: 'Test Event',
        dateTime: '2024-12-31T14:00:00',
        totalSlots: 50
      };

      const result = await createEventUseCase.execute(eventData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: title, description, dateTime, totalSlots');
      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });

    it('should return error when dateTime is missing', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        totalSlots: 50
      };

      const result = await createEventUseCase.execute(eventData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: title, description, dateTime, totalSlots');
      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });

    it('should return error when totalSlots is missing', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        dateTime: '2024-12-31T14:00:00'
      };

      const result = await createEventUseCase.execute(eventData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: title, description, dateTime, totalSlots');
      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });

    it('should return error when totalSlots is less than 1', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        dateTime: '2024-12-31T14:00:00',
        totalSlots: 0
      };

      const result = await createEventUseCase.execute(eventData);

      expect(result.success).toBe(false);
      // 0 is falsy, so it's caught by the first validation
      expect(result.error).toBe('Missing required fields: title, description, dateTime, totalSlots');
      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });

    it('should return error when totalSlots is negative', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        dateTime: '2024-12-31T14:00:00',
        totalSlots: -5
      };

      const result = await createEventUseCase.execute(eventData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Total slots must be at least 1');
      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('Successful Creation', () => {
    it('should create event successfully with valid data', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        dateTime: '2024-12-31T14:00:00',
        totalSlots: 50
      };

      const createdEvent = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31T14:00:00'),
        totalSlots: 50,
        availableSlots: 50,
        toJSON: jest.fn().mockReturnValue({
          id: '123',
          title: 'Test Event',
          description: 'Test Description',
          dateTime: new Date('2024-12-31T14:00:00'),
          totalSlots: 50,
          availableSlots: 50
        })
      };

      mockEventRepository.create.mockResolvedValue(createdEvent);

      const result = await createEventUseCase.execute(eventData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.title).toBe('Test Event');
      expect(result.data.totalSlots).toBe(50);
      expect(result.data.availableSlots).toBe(50);
      expect(mockEventRepository.create).toHaveBeenCalledTimes(1);

      // Verify that the event is created with isActive: true
      const createdEventArg = mockEventRepository.create.mock.calls[0][0];
      expect(createdEventArg.isActive).toBe(true);
    });

    it('should create event successfully with local field', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        dateTime: '2024-12-31T14:00:00',
        totalSlots: 50,
        local: 'Main Auditorium'
      };

      const createdEvent = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31T14:00:00'),
        totalSlots: 50,
        availableSlots: 50,
        local: 'Main Auditorium',
        toJSON: jest.fn().mockReturnValue({
          id: '123',
          title: 'Test Event',
          description: 'Test Description',
          dateTime: new Date('2024-12-31T14:00:00'),
          totalSlots: 50,
          availableSlots: 50,
          local: 'Main Auditorium'
        })
      };

      mockEventRepository.create.mockResolvedValue(createdEvent);

      const result = await createEventUseCase.execute(eventData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.title).toBe('Test Event');
      expect(result.data.local).toBe('Main Auditorium');
      expect(mockEventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Event',
          local: 'Main Auditorium'
        })
      );
    });

    it('should parse totalSlots as integer', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        dateTime: '2024-12-31T14:00:00',
        totalSlots: '50' // String instead of number
      };

      const createdEvent = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31T14:00:00'),
        totalSlots: 50,
        availableSlots: 50,
        toJSON: jest.fn().mockReturnValue({
          id: '123',
          title: 'Test Event',
          description: 'Test Description',
          dateTime: new Date('2024-12-31T14:00:00'),
          totalSlots: 50,
          availableSlots: 50
        })
      };

      mockEventRepository.create.mockResolvedValue(createdEvent);

      const result = await createEventUseCase.execute(eventData);

      expect(result.success).toBe(true);
      expect(mockEventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalSlots: 50,
          availableSlots: 50
        })
      );
    });

    it('should set availableSlots equal to totalSlots', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        dateTime: '2024-12-31T14:00:00',
        totalSlots: 100
      };

      const createdEvent = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31T14:00:00'),
        totalSlots: 100,
        availableSlots: 100,
        toJSON: jest.fn().mockReturnValue({
          id: '123',
          title: 'Test Event',
          description: 'Test Description',
          dateTime: new Date('2024-12-31T14:00:00'),
          totalSlots: 100,
          availableSlots: 100
        })
      };

      mockEventRepository.create.mockResolvedValue(createdEvent);

      const result = await createEventUseCase.execute(eventData);

      expect(result.success).toBe(true);
      expect(result.data.availableSlots).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        dateTime: '2024-12-31T14:00:00',
        totalSlots: 50
      };

      mockEventRepository.create.mockRejectedValue(new Error('Database connection error'));

      const result = await createEventUseCase.execute(eventData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection error');
    });
  });
});
