const VerifyRegistrationUseCase = require('../VerifyRegistrationUseCase');

describe('VerifyRegistrationUseCase', () => {
  let mockEventRepository;
  let mockWhatsAppService;
  let verifyRegistrationUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn(),
      verifyParticipant: jest.fn()
    };
    mockWhatsAppService = {
      sendMessage: jest.fn().mockResolvedValue(true)
    };
    verifyRegistrationUseCase = new VerifyRegistrationUseCase(
      mockEventRepository,
      mockWhatsAppService,
      'pt-BR'
    );
  });

  describe('Validation', () => {
    it('should return error when eventId is missing', async () => {
      const result = await verifyRegistrationUseCase.execute(null, '123', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: eventId, participantId, verificationCode');
    });

    it('should return error when participantId is missing', async () => {
      const result = await verifyRegistrationUseCase.execute('123', null, '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: eventId, participantId, verificationCode');
    });

    it('should return error when verificationCode is missing', async () => {
      const result = await verifyRegistrationUseCase.execute('123', '456', null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: eventId, participantId, verificationCode');
    });
  });

  describe('Business Rules', () => {
    it('should return error when event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await verifyRegistrationUseCase.execute('999', '123', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
    });

    it('should return error when participant not found', async () => {
      const mockEvent = {
        id: '123',
        title: 'Test Event',
        participants: []
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await verifyRegistrationUseCase.execute('123', '999', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Pending registration not found');
    });

    it('should return error when registration is already verified', async () => {
      const mockEvent = {
        id: '123',
        title: 'Test Event',
        participants: [
          {
            id: '456',
            name: 'John Doe',
            phone: '11987654321',
            status: 'pending',
            verified: true,
            verificationCode: '123456',
            registeredAt: new Date()
          }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await verifyRegistrationUseCase.execute('123', '456', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Registration already verified');
    });

    it('should return error when verification code is invalid', async () => {
      const mockEvent = {
        id: '123',
        title: 'Test Event',
        participants: [
          {
            id: '456',
            name: 'John Doe',
            phone: '11987654321',
            status: 'pending',
            verified: false,
            verificationCode: '123456',
            registeredAt: new Date()
          }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await verifyRegistrationUseCase.execute('123', '456', '999999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid verification code');
    });

    it('should return error when verification code is expired (>24 hours)', async () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25); // 25 hours ago

      const mockEvent = {
        id: '123',
        title: 'Test Event',
        participants: [
          {
            id: '456',
            name: 'John Doe',
            phone: '11987654321',
            status: 'pending',
            verified: false,
            verificationCode: '123456',
            registeredAt: oldDate
          }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await verifyRegistrationUseCase.execute('123', '456', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Verification code expired. Please register again.');
    });

    it('should return error when event is no longer active', async () => {
      const mockEvent = {
        id: '123',
        title: 'Test Event',
        isActive: false,
        participants: [
          {
            id: '456',
            name: 'John Doe',
            phone: '11987654321',
            status: 'pending',
            verified: false,
            verificationCode: '123456',
            registeredAt: new Date()
          }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await verifyRegistrationUseCase.execute('123', '456', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event is no longer active');
    });

    it('should return error when event is full (no available slots)', async () => {
      const mockEvent = {
        id: '123',
        title: 'Test Event',
        isActive: true,
        totalSlots: 2,
        participants: [
          {
            id: '456',
            name: 'John Doe',
            phone: '11987654321',
            status: 'pending',
            verified: false,
            verificationCode: '123456',
            registeredAt: new Date()
          },
          {
            id: '789',
            name: 'Jane Smith',
            phone: '11987654322',
            status: 'active',
            verified: true,
            registeredAt: new Date()
          },
          {
            id: '101',
            name: 'Bob Johnson',
            phone: '11987654323',
            status: 'active',
            verified: true,
            registeredAt: new Date()
          }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await verifyRegistrationUseCase.execute('123', '456', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event is full. No available slots remaining.');
    });
  });

  describe('Successful Verification', () => {
    it('should verify registration with correct code', async () => {
      const mockEvent = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2026-01-15T14:00:00'),
        local: 'Test Location',
        isActive: true,
        totalSlots: 10,
        participants: [
          {
            id: '456',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '11987654321',
            status: 'pending',
            verified: false,
            verificationCode: '123456',
            registeredAt: new Date()
          }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.verifyParticipant.mockResolvedValue(true);

      const result = await verifyRegistrationUseCase.execute('123', '456', '123456');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration verified successfully');
      expect(mockEventRepository.verifyParticipant).toHaveBeenCalledWith('123', '456');
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledWith(
        '11987654321',
        expect.stringContaining('Inscrição Confirmada')
      );
    });

    it('should trim verification code before comparing', async () => {
      const mockEvent = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2026-01-15T14:00:00'),
        local: 'Test Location',
        isActive: true,
        totalSlots: 10,
        participants: [
          {
            id: '456',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '11987654321',
            status: 'pending',
            verified: false,
            verificationCode: '123456',
            registeredAt: new Date()
          }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.verifyParticipant.mockResolvedValue(true);

      const result = await verifyRegistrationUseCase.execute('123', '456', ' 123456 ');

      expect(result.success).toBe(true);
    });

    it('should succeed even if WhatsApp confirmation fails', async () => {
      const mockWhatsAppServiceWithError = {
        sendMessage: jest.fn().mockRejectedValue(new Error('WhatsApp API error'))
      };

      const verifyUseCaseWithError = new VerifyRegistrationUseCase(
        mockEventRepository,
        mockWhatsAppServiceWithError,
        'pt-BR'
      );

      const mockEvent = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2026-01-15T14:00:00'),
        local: 'Test Location',
        isActive: true,
        totalSlots: 10,
        participants: [
          {
            id: '456',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '11987654321',
            status: 'pending',
            verified: false,
            verificationCode: '123456',
            registeredAt: new Date()
          }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.verifyParticipant.mockResolvedValue(true);

      const result = await verifyUseCaseWithError.execute('123', '456', '123456');

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockEventRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await verifyRegistrationUseCase.execute('123', '456', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should return error if verification update fails', async () => {
      const mockEvent = {
        id: '123',
        title: 'Test Event',
        isActive: true,
        totalSlots: 10,
        participants: [
          {
            id: '456',
            name: 'John Doe',
            phone: '11987654321',
            status: 'pending',
            verified: false,
            verificationCode: '123456',
            registeredAt: new Date()
          }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockEventRepository.verifyParticipant.mockResolvedValue(false);

      const result = await verifyRegistrationUseCase.execute('123', '456', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to verify registration');
    });
  });
});
