const CancelRegistrationUseCase = require('../CancelRegistrationUseCase');

describe('CancelRegistrationUseCase', () => {
  let mockEventRepository;
  let mockWhatsAppService;
  let cancelRegistrationUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn(),
      cancelParticipant: jest.fn()
    };
    mockWhatsAppService = {
      sendMessage: jest.fn().mockResolvedValue(true)
    };
    cancelRegistrationUseCase = new CancelRegistrationUseCase(
      mockEventRepository,
      mockWhatsAppService,
      'pt-BR'
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
        description: 'Test Description',
        dateTime: new Date('2026-12-31T10:00:00'),
        local: 'Test Location',
        availableSlots: 5,
        totalSlots: 10,
        participants: [
          { id: '111', name: 'John', email: 'john@test.com', phone: '+5511999999999', status: 'active' }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.cancelParticipant.mockResolvedValue(true);

      const result = await cancelRegistrationUseCase.execute('222', '111');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration cancelled successfully');
      expect(mockEventRepository.cancelParticipant).toHaveBeenCalledWith('222', '111');
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledWith(
        '+5511999999999',
        expect.stringContaining('Inscrição Cancelada')
      );
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledWith(
        '+5511999999999',
        expect.stringContaining('John')
      );
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledWith(
        '+5511999999999',
        expect.stringContaining('Test Event')
      );
    });

    it('should properly cancel registration', async () => {
      const mockEvent = {
        id: '123',
        title: 'Workshop',
        description: 'Test Workshop',
        dateTime: new Date('2026-12-31T14:00:00'),
        local: 'Room 101',
        participants: [
          { id: '789', name: 'Maria', email: 'maria@test.com', phone: '+5511888888888', status: 'active' }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.cancelParticipant.mockResolvedValue(true);

      const result = await cancelRegistrationUseCase.execute('123', '789');

      expect(result.success).toBe(true);
      expect(mockEventRepository.cancelParticipant).toHaveBeenCalledWith('123', '789');
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should cancel registration even if WhatsApp notification fails', async () => {
      const mockEvent = {
        id: '222',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2026-12-31T10:00:00'),
        local: 'Test Location',
        participants: [
          { id: '111', name: 'John', email: 'john@test.com', phone: '+5511999999999', status: 'active' }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.cancelParticipant.mockResolvedValue(true);
      mockWhatsAppService.sendMessage.mockRejectedValue(new Error('WhatsApp API error'));

      const result = await cancelRegistrationUseCase.execute('222', '111');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration cancelled successfully');
      expect(mockEventRepository.cancelParticipant).toHaveBeenCalledWith('222', '111');
    });

    it('should work without WhatsApp service', async () => {
      const useCaseWithoutWhatsApp = new CancelRegistrationUseCase(mockEventRepository);
      const mockEvent = {
        id: '222',
        title: 'Test Event',
        participants: [
          { id: '111', name: 'John', email: 'john@test.com', phone: '+5511999999999', status: 'active' }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.cancelParticipant.mockResolvedValue(true);

      const result = await useCaseWithoutWhatsApp.execute('222', '111');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration cancelled successfully');
    });

    it('should not send WhatsApp if participant has no phone', async () => {
      const mockEvent = {
        id: '222',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2026-12-31T10:00:00'),
        local: 'Test Location',
        participants: [
          { id: '111', name: 'John', email: 'john@test.com', phone: null, status: 'active' }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.cancelParticipant.mockResolvedValue(true);

      const result = await cancelRegistrationUseCase.execute('222', '111');

      expect(result.success).toBe(true);
      expect(mockWhatsAppService.sendMessage).not.toHaveBeenCalled();
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
        title: 'Test Event',
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
