const CancelRegistrationUseCase = require('../CancelRegistrationUseCase');

describe('CancelRegistrationUseCase', () => {
  let mockEventRepository;
  let cancelRegistrationUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn(),
      cancelParticipant: jest.fn()
    };
    cancelRegistrationUseCase = new CancelRegistrationUseCase(
      mockEventRepository
    );
  });

  describe('Validation', () => {
    it('should return error when event ID is missing', async () => {
      const result = await cancelRegistrationUseCase.execute(null, '123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event ID and Participant ID are required');
    });

    it('should return error when participant ID is missing', async () => {
      const result = await cancelRegistrationUseCase.execute('event123', null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event ID and Participant ID are required');
    });
  });

  describe('Business Rules', () => {
    it('should return error when event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await cancelRegistrationUseCase.execute('event123', 'participant456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
      expect(mockEventRepository.findById).toHaveBeenCalledWith('event123');
    });

    it('should return error when registration does not exist', async () => {
      const mockEvent = {
        id: '222',
        title: 'Test Event',
        participants: []
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await cancelRegistrationUseCase.execute('222', '999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Active registration not found');
    });

    it('should return error when registration is already cancelled', async () => {
      const mockEvent = {
        id: '333',
        title: 'Test Event',
        participants: [
          { id: '555', name: 'John', email: 'john@test.com', status: 'cancelled' }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await cancelRegistrationUseCase.execute('333', '555');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Active registration not found');
    });
  });

  describe('Successful Cancellation', () => {
    it('should cancel registration and restore available slots', async () => {
      const mockEvent = {
        id: '222',
        title: 'Test Event',
        availableSlots: 5,
        totalSlots: 10,
        participants: [
          { id: '111', name: 'John', email: 'john@test.com', status: 'active' }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.cancelParticipant.mockResolvedValue(true);

      const result = await cancelRegistrationUseCase.execute('222', '111');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration cancelled successfully');
      expect(mockEventRepository.cancelParticipant).toHaveBeenCalledWith('222', '111');
    });

    it('should properly cancel registration', async () => {
      const mockEvent = {
        id: '123',
        participants: [
          { id: '789', name: 'Maria', email: 'maria@test.com', status: 'active' }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.cancelParticipant.mockResolvedValue(true);

      const result = await cancelRegistrationUseCase.execute('123', '789');

      expect(result.success).toBe(true);
      expect(mockEventRepository.cancelParticipant).toHaveBeenCalledWith('123', '789');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockEventRepository.findById.mockRejectedValue(new Error('Database connection error'));

      const result = await cancelRegistrationUseCase.execute('123', '456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection error');
    });

    it('should handle errors during cancellation process', async () => {
      const mockEvent = {
        id: '123',
        participants: [
          { id: '456', name: 'John', email: 'john@test.com', status: 'active' }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.cancelParticipant.mockResolvedValue(false);

      const result = await cancelRegistrationUseCase.execute('123', '456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to cancel registration');
    });
  });
});
