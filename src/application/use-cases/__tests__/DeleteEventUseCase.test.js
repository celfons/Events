const DeleteEventUseCase = require('../DeleteEventUseCase');

describe('DeleteEventUseCase', () => {
  let mockEventRepository;
  let deleteEventUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn(),
      delete: jest.fn()
    };
    deleteEventUseCase = new DeleteEventUseCase(mockEventRepository);
  });

  describe('Successful Deletion', () => {
    it('should delete event successfully', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        title: 'Test Event',
        description: 'Test Description'
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.delete.mockResolvedValue(true);

      const result = await deleteEventUseCase.execute(eventId);

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Event deleted successfully');
      expect(mockEventRepository.findById).toHaveBeenCalledWith(eventId);
      expect(mockEventRepository.delete).toHaveBeenCalledWith(eventId);
    });
  });

  describe('Validation', () => {
    it('should return error if event ID is not provided', async () => {
      const result = await deleteEventUseCase.execute('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event ID is required');
      expect(mockEventRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error if event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await deleteEventUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
      expect(mockEventRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockEventRepository.findById.mockRejectedValue(new Error('Database connection error'));

      const result = await deleteEventUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection error');
    });

    it('should handle deletion errors gracefully', async () => {
      const existingEvent = { id: '123', title: 'Test Event' };
      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.delete.mockRejectedValue(new Error('Deletion failed'));

      const result = await deleteEventUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Deletion failed');
    });
  });
});
