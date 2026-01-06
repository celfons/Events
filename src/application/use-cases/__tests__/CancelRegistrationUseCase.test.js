const CancelRegistrationUseCase = require('../CancelRegistrationUseCase');

describe('CancelRegistrationUseCase', () => {
  let mockEventRepository;
  let mockRegistrationRepository;
  let cancelRegistrationUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      incrementAvailableSlots: jest.fn(),
      decrementAvailableSlots: jest.fn()
    };
    mockRegistrationRepository = {
      findById: jest.fn(),
      update: jest.fn()
    };
    cancelRegistrationUseCase = new CancelRegistrationUseCase(
      mockEventRepository,
      mockRegistrationRepository
    );
  });

  describe('Validation', () => {
    it('should return error when registration is not found', async () => {
      mockRegistrationRepository.findById.mockResolvedValue(null);

      const result = await cancelRegistrationUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Registration not found');
      expect(mockRegistrationRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should return error when registration is already cancelled', async () => {
      const mockRegistration = {
        id: '123',
        eventId: '456',
        status: 'cancelled',
        isActive: jest.fn().mockReturnValue(false)
      };

      mockRegistrationRepository.findById.mockResolvedValue(mockRegistration);

      const result = await cancelRegistrationUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Registration is already cancelled');
      expect(mockRegistration.isActive).toHaveBeenCalled();
    });

    it('should return error when event is not found', async () => {
      const mockRegistration = {
        id: '123',
        eventId: '456',
        status: 'active',
        isActive: jest.fn().mockReturnValue(true),
        cancel: jest.fn()
      };

      mockRegistrationRepository.findById.mockResolvedValue(mockRegistration);
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await cancelRegistrationUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
      expect(mockEventRepository.findById).toHaveBeenCalledWith('456');
    });
  });

  describe('Successful Cancellation', () => {
    it('should cancel registration successfully and atomically increment available slots', async () => {
      const mockRegistration = {
        id: '123',
        eventId: '456',
        status: 'active',
        isActive: jest.fn().mockReturnValue(true),
        cancel: jest.fn()
      };

      const mockEvent = {
        id: '456',
        availableSlots: 10
      };

      const updatedEvent = {
        id: '456',
        availableSlots: 11
      };

      mockRegistrationRepository.findById.mockResolvedValue(mockRegistration);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockRegistrationRepository.update.mockResolvedValue(true);
      mockEventRepository.incrementAvailableSlots.mockResolvedValue(updatedEvent);

      // Mock the cancel method to update status
      mockRegistration.cancel.mockImplementation(() => {
        mockRegistration.status = 'cancelled';
      });

      const result = await cancelRegistrationUseCase.execute('123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration cancelled successfully');
      expect(mockRegistration.cancel).toHaveBeenCalled();
      expect(mockRegistrationRepository.update).toHaveBeenCalledWith('123', {
        status: 'cancelled'
      });
      expect(mockEventRepository.incrementAvailableSlots).toHaveBeenCalledWith('456');
    });

    it('should properly update registration status to cancelled', async () => {
      const mockRegistration = {
        id: '789',
        eventId: '456',
        status: 'active',
        isActive: jest.fn().mockReturnValue(true),
        cancel: jest.fn()
      };

      const mockEvent = {
        id: '456',
        availableSlots: 5
      };

      const updatedEvent = {
        id: '456',
        availableSlots: 6
      };

      mockRegistrationRepository.findById.mockResolvedValue(mockRegistration);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockRegistrationRepository.update.mockResolvedValue(true);
      mockEventRepository.incrementAvailableSlots.mockResolvedValue(updatedEvent);

      mockRegistration.cancel.mockImplementation(() => {
        mockRegistration.status = 'cancelled';
      });

      const result = await cancelRegistrationUseCase.execute('789');

      expect(result.success).toBe(true);
      expect(mockRegistrationRepository.update).toHaveBeenCalledWith('789', {
        status: 'cancelled'
      });
    });

    it('should restore available slots when cancelling', async () => {
      const mockRegistration = {
        id: '111',
        eventId: '222',
        status: 'active',
        isActive: jest.fn().mockReturnValue(true),
        cancel: jest.fn()
      };

      const mockEvent = {
        id: '222',
        totalSlots: 50,
        availableSlots: 25
      };

      const updatedEvent = {
        id: '222',
        totalSlots: 50,
        availableSlots: 26
      };

      mockRegistrationRepository.findById.mockResolvedValue(mockRegistration);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockRegistrationRepository.update.mockResolvedValue(true);
      mockEventRepository.incrementAvailableSlots.mockResolvedValue(updatedEvent);

      mockRegistration.cancel.mockImplementation(() => {
        mockRegistration.status = 'cancelled';
      });

      await cancelRegistrationUseCase.execute('111');

      expect(mockEventRepository.incrementAvailableSlots).toHaveBeenCalledWith('222');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockRegistrationRepository.findById.mockRejectedValue(new Error('Database connection error'));

      const result = await cancelRegistrationUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection error');
    });

    it('should handle errors during cancellation process', async () => {
      const mockRegistration = {
        id: '123',
        eventId: '456',
        status: 'active',
        isActive: jest.fn().mockReturnValue(true),
        cancel: jest.fn()
      };

      const mockEvent = {
        id: '456',
        availableSlots: 10
      };

      mockRegistrationRepository.findById.mockResolvedValue(mockRegistration);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockRegistration.cancel.mockImplementation(() => {
        throw new Error('Cannot cancel registration');
      });

      const result = await cancelRegistrationUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot cancel registration');
    });

    it('should handle data inconsistency gracefully when event is at full capacity', async () => {
      // Bug scenario: Event shows full capacity but user has active registration
      const mockRegistration = {
        id: '999',
        eventId: '888',
        status: 'active',
        isActive: jest.fn().mockReturnValue(true),
        cancel: jest.fn()
      };

      const mockEvent = {
        id: '888',
        totalSlots: 50,
        availableSlots: 50 // Data inconsistency: full capacity but registration exists
      };

      const updatedEvent = {
        id: '888',
        totalSlots: 50,
        availableSlots: 50 // MongoDB will enforce max constraint
      };

      mockRegistrationRepository.findById.mockResolvedValue(mockRegistration);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockRegistrationRepository.update.mockResolvedValue(true);
      mockEventRepository.incrementAvailableSlots.mockResolvedValue(updatedEvent);

      mockRegistration.cancel.mockImplementation(() => {
        mockRegistration.status = 'cancelled';
      });

      const result = await cancelRegistrationUseCase.execute('999');

      // Should succeed despite data inconsistency
      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration cancelled successfully');
      expect(mockRegistration.cancel).toHaveBeenCalled();
      expect(mockEventRepository.incrementAvailableSlots).toHaveBeenCalledWith('888');
    });
  });
});
