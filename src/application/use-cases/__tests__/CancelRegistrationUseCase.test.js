const CancelRegistrationUseCase = require('../CancelRegistrationUseCase');

describe('CancelRegistrationUseCase', () => {
  let mockEventRepository;
  let mockRegistrationRepository;
  let cancelRegistrationUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn(),
      update: jest.fn()
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
    it('should cancel registration successfully and increment available slots', async () => {
      const mockRegistration = {
        id: '123',
        eventId: '456',
        status: 'active',
        isActive: jest.fn().mockReturnValue(true),
        cancel: jest.fn()
      };

      const mockEvent = {
        id: '456',
        availableSlots: 10,
        incrementSlots: jest.fn()
      };

      mockRegistrationRepository.findById.mockResolvedValue(mockRegistration);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockRegistrationRepository.update.mockResolvedValue(true);
      mockEventRepository.update.mockResolvedValue(true);

      // Mock the cancel method to update status
      mockRegistration.cancel.mockImplementation(() => {
        mockRegistration.status = 'cancelled';
      });

      // Mock the incrementSlots to update availableSlots dynamically
      mockEvent.incrementSlots.mockImplementation(() => {
        mockEvent.availableSlots += 1;
      });

      const result = await cancelRegistrationUseCase.execute('123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration cancelled successfully');
      expect(mockRegistration.cancel).toHaveBeenCalled();
      expect(mockRegistrationRepository.update).toHaveBeenCalledWith('123', {
        status: 'cancelled'
      });
      expect(mockEvent.incrementSlots).toHaveBeenCalled();
      expect(mockEventRepository.update).toHaveBeenCalledWith('456', {
        availableSlots: 11
      });
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
        availableSlots: 5,
        incrementSlots: jest.fn()
      };

      mockRegistrationRepository.findById.mockResolvedValue(mockRegistration);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockRegistrationRepository.update.mockResolvedValue(true);
      mockEventRepository.update.mockResolvedValue(true);

      mockRegistration.cancel.mockImplementation(() => {
        mockRegistration.status = 'cancelled';
      });

      mockEvent.incrementSlots.mockImplementation(() => {
        mockEvent.availableSlots += 1;
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
        availableSlots: 25,
        incrementSlots: jest.fn()
      };

      mockRegistrationRepository.findById.mockResolvedValue(mockRegistration);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockRegistrationRepository.update.mockResolvedValue(true);
      mockEventRepository.update.mockResolvedValue(true);

      mockRegistration.cancel.mockImplementation(() => {
        mockRegistration.status = 'cancelled';
      });

      mockEvent.incrementSlots.mockImplementation(() => {
        mockEvent.availableSlots += 1;
      });

      await cancelRegistrationUseCase.execute('111');

      expect(mockEvent.incrementSlots).toHaveBeenCalled();
      expect(mockEventRepository.update).toHaveBeenCalledWith('222', {
        availableSlots: 26
      });
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
        availableSlots: 10,
        incrementSlots: jest.fn()
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
  });
});
