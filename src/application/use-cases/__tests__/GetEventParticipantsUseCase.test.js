const GetEventParticipantsUseCase = require('../GetEventParticipantsUseCase');

describe('GetEventParticipantsUseCase', () => {
  let mockEventRepository;
  let getEventParticipantsUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn()
    };
    getEventParticipantsUseCase = new GetEventParticipantsUseCase(mockEventRepository);
  });

  describe('Validation', () => {
    it('should return error when eventId is missing', async () => {
      const result = await getEventParticipantsUseCase.execute(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event ID is required');
    });
  });

  describe('Business Rules', () => {
    it('should return error when event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await getEventParticipantsUseCase.execute('999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
      expect(mockEventRepository.findById).toHaveBeenCalledWith('999');
    });
  });

  describe('Successful Retrieval', () => {
    it('should return all participants for an event', async () => {
      const eventId = '123';
      const mockEvent = {
        id: eventId,
        title: 'Test Event',
        participants: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '123-456-7890',
            status: 'confirmed',
            registeredAt: new Date()
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '098-765-4321',
            status: 'confirmed',
            registeredAt: new Date()
          }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await getEventParticipantsUseCase.execute(eventId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('John Doe');
      expect(result.data[1].name).toBe('Jane Smith');
    });

    it('should return empty array when no participants exist', async () => {
      const eventId = '456';
      const mockEvent = {
        id: eventId,
        title: 'New Event',
        participants: []
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await getEventParticipantsUseCase.execute(eventId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should filter out cancelled participants', async () => {
      const eventId = '789';
      const mockEvent = {
        id: eventId,
        title: 'Test Event',
        participants: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '123-456-7890',
            status: 'confirmed',
            registeredAt: new Date()
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '098-765-4321',
            status: 'cancelled',
            registeredAt: new Date()
          }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await getEventParticipantsUseCase.execute(eventId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('John Doe');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockEventRepository.findById.mockRejectedValue(new Error('Query failed'));

      const result = await getEventParticipantsUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Query failed');
    });
  });
});
