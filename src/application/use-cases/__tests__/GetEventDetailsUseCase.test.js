const GetEventDetailsUseCase = require('../GetEventDetailsUseCase');

describe('GetEventDetailsUseCase', () => {
  let mockEventRepository;
  let getEventDetailsUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn()
    };
    getEventDetailsUseCase = new GetEventDetailsUseCase(mockEventRepository);
  });

  describe('Successful Retrieval', () => {
    it('should return event details with registrations count', async () => {
      const mockEvent = {
        id: '123',
        title: 'Test Event',
        description: 'Description',
        dateTime: new Date(),
        totalSlots: 50,
        availableSlots: 47,
        participants: [
          { id: '1', name: 'John', email: 'john@test.com', status: 'active' },
          { id: '2', name: 'Jane', email: 'jane@test.com', status: 'active' },
          { id: '3', name: 'Bob', email: 'bob@test.com', status: 'active' }
        ],
        toJSON: jest.fn().mockReturnValue({
          id: '123',
          title: 'Test Event',
          availableSlots: 47,
          totalSlots: 50,
          participants: [
            { id: '1', name: 'John', email: 'john@test.com', status: 'active' },
            { id: '2', name: 'Jane', email: 'jane@test.com', status: 'active' },
            { id: '3', name: 'Bob', email: 'bob@test.com', status: 'active' }
          ]
        })
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await getEventDetailsUseCase.execute('123');

      expect(result.success).toBe(true);
      expect(result.data.event).toBeDefined();
      expect(result.data.event.title).toBe('Test Event');
      expect(result.data.registrationsCount).toBe(3);
    });

    it('should return event with zero registrations', async () => {
      const mockEvent = {
        id: '456',
        title: 'New Event',
        participants: [],
        toJSON: jest.fn().mockReturnValue({
          id: '456',
          title: 'New Event',
          participants: []
        })
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await getEventDetailsUseCase.execute('456');

      expect(result.success).toBe(true);
      expect(result.data.event.title).toBe('New Event');
      expect(result.data.registrationsCount).toBe(0);
    });

    it('should call toJSON on the event', async () => {
      const mockEvent = {
        id: '789',
        title: 'Another Event',
        participants: [],
        toJSON: jest.fn().mockReturnValue({
          id: '789',
          title: 'Another Event',
          participants: []
        })
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      await getEventDetailsUseCase.execute('789');

      expect(mockEvent.toJSON).toHaveBeenCalled();
    });
  });

  describe('Error Cases', () => {
    it('should return error when event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await getEventDetailsUseCase.execute('999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when fetching event', async () => {
      mockEventRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await getEventDetailsUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
