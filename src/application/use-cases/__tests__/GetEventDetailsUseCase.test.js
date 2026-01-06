const GetEventDetailsUseCase = require('../GetEventDetailsUseCase');

describe('GetEventDetailsUseCase', () => {
  let mockEventRepository;
  let mockRegistrationRepository;
  let getEventDetailsUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn()
    };
    mockRegistrationRepository = {
      findByEventId: jest.fn()
    };
    getEventDetailsUseCase = new GetEventDetailsUseCase(
      mockEventRepository,
      mockRegistrationRepository
    );
  });

  describe('Successful Retrieval', () => {
    it('should return event details with registrations count', async () => {
      const mockEvent = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 30,
        toJSON: jest.fn().mockReturnValue({
          id: '123',
          title: 'Test Event',
          description: 'Test Description',
          dateTime: new Date('2024-12-31'),
          totalSlots: 50,
          availableSlots: 30
        })
      };

      const mockRegistrations = [
        { id: '1', eventId: '123', name: 'User 1' },
        { id: '2', eventId: '123', name: 'User 2' },
        { id: '3', eventId: '123', name: 'User 3' }
      ];

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue(mockRegistrations);

      const result = await getEventDetailsUseCase.execute('123');

      expect(result.success).toBe(true);
      expect(result.data.event).toBeDefined();
      expect(result.data.event.title).toBe('Test Event');
      expect(result.data.registrationsCount).toBe(3);
      expect(mockEventRepository.findById).toHaveBeenCalledWith('123');
      expect(mockRegistrationRepository.findByEventId).toHaveBeenCalledWith('123');
    });

    it('should return event with zero registrations', async () => {
      const mockEvent = {
        id: '456',
        title: 'New Event',
        description: 'New Description',
        dateTime: new Date('2024-12-25'),
        totalSlots: 100,
        availableSlots: 100,
        toJSON: jest.fn().mockReturnValue({
          id: '456',
          title: 'New Event',
          description: 'New Description',
          dateTime: new Date('2024-12-25'),
          totalSlots: 100,
          availableSlots: 100
        })
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue([]);

      const result = await getEventDetailsUseCase.execute('456');

      expect(result.success).toBe(true);
      expect(result.data.event.title).toBe('New Event');
      expect(result.data.registrationsCount).toBe(0);
    });

    it('should call toJSON on the event', async () => {
      const mockEvent = {
        id: '789',
        title: 'Event with JSON',
        toJSON: jest.fn().mockReturnValue({ id: '789', title: 'Event with JSON' })
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue([]);

      await getEventDetailsUseCase.execute('789');

      expect(mockEvent.toJSON).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should return error when event is not found', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await getEventDetailsUseCase.execute('999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
      expect(mockEventRepository.findById).toHaveBeenCalledWith('999');
      expect(mockRegistrationRepository.findByEventId).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockEventRepository.findById.mockRejectedValue(new Error('Database connection error'));

      const result = await getEventDetailsUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection error');
    });

    it('should handle errors when fetching registrations', async () => {
      const mockEvent = {
        id: '123',
        title: 'Test Event',
        toJSON: jest.fn().mockReturnValue({ id: '123', title: 'Test Event' })
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockRegistrationRepository.findByEventId.mockRejectedValue(new Error('Registration fetch error'));

      const result = await getEventDetailsUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Registration fetch error');
    });
  });
});
