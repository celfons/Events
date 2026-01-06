const GetEventParticipantsUseCase = require('../GetEventParticipantsUseCase');

describe('GetEventParticipantsUseCase', () => {
  let mockEventRepository;
  let mockRegistrationRepository;
  let getEventParticipantsUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn()
    };
    mockRegistrationRepository = {
      findByEventId: jest.fn()
    };
    getEventParticipantsUseCase = new GetEventParticipantsUseCase(
      mockEventRepository,
      mockRegistrationRepository
    );
  });

  describe('Successful Retrieval', () => {
    it('should return all participants for an event', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        title: 'Test Event'
      };

      const mockParticipants = [
        {
          id: '1',
          eventId: eventId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          toJSON: jest.fn().mockReturnValue({
            id: '1',
            eventId: eventId,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890'
          })
        },
        {
          id: '2',
          eventId: eventId,
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '0987654321',
          toJSON: jest.fn().mockReturnValue({
            id: '2',
            eventId: eventId,
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '0987654321'
          })
        }
      ];

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue(mockParticipants);

      const result = await getEventParticipantsUseCase.execute(eventId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('John Doe');
      expect(result.data[1].name).toBe('Jane Smith');
      expect(mockEventRepository.findById).toHaveBeenCalledWith(eventId);
      expect(mockRegistrationRepository.findByEventId).toHaveBeenCalledWith(eventId);
    });

    it('should return empty array when no participants exist', async () => {
      const eventId = '123';
      const existingEvent = { id: eventId, title: 'Test Event' };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue([]);

      const result = await getEventParticipantsUseCase.execute(eventId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(mockRegistrationRepository.findByEventId).toHaveBeenCalledWith(eventId);
    });

    it('should call toJSON on each registration', async () => {
      const eventId = '123';
      const existingEvent = { id: eventId, title: 'Test Event' };
      
      const mockParticipants = [
        {
          id: '1',
          name: 'John',
          toJSON: jest.fn().mockReturnValue({ id: '1', name: 'John' })
        }
      ];

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue(mockParticipants);

      await getEventParticipantsUseCase.execute(eventId);

      expect(mockParticipants[0].toJSON).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should return error if event ID is not provided', async () => {
      const result = await getEventParticipantsUseCase.execute('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event ID is required');
      expect(mockEventRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error if event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await getEventParticipantsUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
      expect(mockRegistrationRepository.findByEventId).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockEventRepository.findById.mockRejectedValue(new Error('Database connection error'));

      const result = await getEventParticipantsUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection error');
    });

    it('should handle registration repository errors', async () => {
      const existingEvent = { id: '123', title: 'Test Event' };
      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockRegistrationRepository.findByEventId.mockRejectedValue(new Error('Query failed'));

      const result = await getEventParticipantsUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Query failed');
    });
  });
});
