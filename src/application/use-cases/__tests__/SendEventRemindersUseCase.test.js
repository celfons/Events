const SendEventRemindersUseCase = require('../SendEventRemindersUseCase');

describe('SendEventRemindersUseCase', () => {
  let useCase;
  let mockEventRepository;
  let mockRegistrationRepository;
  let mockWhatsAppService;

  beforeEach(() => {
    mockEventRepository = {
      findUpcomingEvents: jest.fn()
    };

    mockRegistrationRepository = {
      findByEventId: jest.fn()
    };

    mockWhatsAppService = {
      sendBulkMessages: jest.fn()
    };

    useCase = new SendEventRemindersUseCase(
      mockEventRepository,
      mockRegistrationRepository,
      mockWhatsAppService
    );
  });

  describe('execute', () => {
    it('should return success message when no upcoming events found', async () => {
      mockEventRepository.findUpcomingEvents.mockResolvedValue([]);

      const result = await useCase.execute({ hoursAhead: 24 });

      expect(result.success).toBe(true);
      expect(result.message).toBe('No upcoming events found');
      expect(result.data.eventsProcessed).toBe(0);
      expect(result.data.messagesSent).toBe(0);
    });

    it('should send reminders to all participants of upcoming events', async () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        dateTime: new Date('2024-12-31T14:00:00'),
        description: 'Test description'
      };

      const mockParticipants = [
        {
          id: 'p1',
          name: 'João Silva',
          phone: '+5511987654321',
          email: 'joao@example.com'
        },
        {
          id: 'p2',
          name: 'Maria Santos',
          phone: '+5511987654322',
          email: 'maria@example.com'
        }
      ];

      mockEventRepository.findUpcomingEvents.mockResolvedValue([mockEvent]);
      mockRegistrationRepository.findByEventId.mockResolvedValue(mockParticipants);
      mockWhatsAppService.sendBulkMessages.mockResolvedValue({
        success: true,
        results: [
          { success: true, phoneNumber: '+5511987654321' },
          { success: true, phoneNumber: '+5511987654322' }
        ],
        successful: 2,
        failed: 0
      });

      const result = await useCase.execute({ hoursAhead: 24 });

      expect(result.success).toBe(true);
      expect(result.data.eventsProcessed).toBe(1);
      expect(result.data.messagesSent).toBe(2);
      expect(result.data.messagesFailed).toBe(0);
      expect(mockWhatsAppService.sendBulkMessages).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            phoneNumber: '+5511987654321',
            message: expect.stringContaining('Test Event')
          }),
          expect.objectContaining({
            phoneNumber: '+5511987654322',
            message: expect.stringContaining('Test Event')
          })
        ])
      );
    });

    it('should handle events with no participants', async () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        dateTime: new Date('2024-12-31T14:00:00')
      };

      mockEventRepository.findUpcomingEvents.mockResolvedValue([mockEvent]);
      mockRegistrationRepository.findByEventId.mockResolvedValue([]);

      const result = await useCase.execute({ hoursAhead: 24 });

      expect(result.success).toBe(true);
      expect(result.data.eventsProcessed).toBe(1);
      expect(result.data.messagesSent).toBe(0);
      expect(mockWhatsAppService.sendBulkMessages).not.toHaveBeenCalled();
    });

    it('should process multiple events', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1', dateTime: new Date('2024-12-31T14:00:00') },
        { id: '2', title: 'Event 2', dateTime: new Date('2024-12-31T15:00:00') }
      ];

      const mockParticipants1 = [
        { id: 'p1', name: 'João', phone: '+5511111111', email: 'joao@test.com' }
      ];

      const mockParticipants2 = [
        { id: 'p2', name: 'Maria', phone: '+5522222222', email: 'maria@test.com' }
      ];

      mockEventRepository.findUpcomingEvents.mockResolvedValue(mockEvents);
      mockRegistrationRepository.findByEventId
        .mockResolvedValueOnce(mockParticipants1)
        .mockResolvedValueOnce(mockParticipants2);
      
      mockWhatsAppService.sendBulkMessages
        .mockResolvedValueOnce({ success: true, successful: 1, failed: 0 })
        .mockResolvedValueOnce({ success: true, successful: 1, failed: 0 });

      const result = await useCase.execute({ hoursAhead: 24 });

      expect(result.success).toBe(true);
      expect(result.data.eventsProcessed).toBe(2);
      expect(result.data.messagesSent).toBe(2);
      expect(mockWhatsAppService.sendBulkMessages).toHaveBeenCalledTimes(2);
    });

    it('should track failed messages', async () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        dateTime: new Date('2024-12-31T14:00:00')
      };

      const mockParticipants = [
        { id: 'p1', name: 'João', phone: '+5511111111', email: 'joao@test.com' },
        { id: 'p2', name: 'Maria', phone: '+5522222222', email: 'maria@test.com' }
      ];

      mockEventRepository.findUpcomingEvents.mockResolvedValue([mockEvent]);
      mockRegistrationRepository.findByEventId.mockResolvedValue(mockParticipants);
      mockWhatsAppService.sendBulkMessages.mockResolvedValue({
        success: true,
        successful: 1,
        failed: 1
      });

      const result = await useCase.execute({ hoursAhead: 24 });

      expect(result.success).toBe(true);
      expect(result.data.messagesSent).toBe(1);
      expect(result.data.messagesFailed).toBe(1);
    });

    it('should use default hoursAhead of 24 when not provided', async () => {
      mockEventRepository.findUpcomingEvents.mockResolvedValue([]);

      await useCase.execute();

      expect(mockEventRepository.findUpcomingEvents).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });

    it('should handle repository errors', async () => {
      mockEventRepository.findUpcomingEvents.mockRejectedValue(
        new Error('Database error')
      );

      const result = await useCase.execute({ hoursAhead: 24 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should include event details in reminder message', async () => {
      const mockEvent = {
        id: '1',
        title: 'Workshop Node.js',
        dateTime: new Date('2024-12-31T14:30:00'),
        description: 'Learn Node.js'
      };

      const mockParticipant = {
        id: 'p1',
        name: 'João Silva',
        phone: '+5511987654321',
        email: 'joao@test.com'
      };

      mockEventRepository.findUpcomingEvents.mockResolvedValue([mockEvent]);
      mockRegistrationRepository.findByEventId.mockResolvedValue([mockParticipant]);
      mockWhatsAppService.sendBulkMessages.mockResolvedValue({
        success: true,
        successful: 1,
        failed: 0
      });

      await useCase.execute({ hoursAhead: 24 });

      expect(mockWhatsAppService.sendBulkMessages).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            phoneNumber: '+5511987654321',
            message: expect.stringMatching(/João Silva/)
          })
        ])
      );

      const callArgs = mockWhatsAppService.sendBulkMessages.mock.calls[0][0];
      const message = callArgs[0].message;
      
      expect(message).toContain('Workshop Node.js');
      expect(message).toContain('João Silva');
    });
  });
});
