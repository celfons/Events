const SendEventReminderUseCase = require('../SendEventReminderUseCase');

describe('SendEventReminderUseCase', () => {
  let mockEventRepository;
  let mockMessagingService;
  let sendEventReminderUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn()
    };
    mockMessagingService = {
      sendEventReminder: jest.fn()
    };
    sendEventReminderUseCase = new SendEventReminderUseCase(mockEventRepository, mockMessagingService);
  });

  describe('Successful Execution', () => {
    it('should send reminders to all confirmed participants', async () => {
      const eventId = '123';
      const event = {
        id: eventId,
        title: 'Test Event',
        dateTime: new Date('2024-12-31T10:00:00'),
        local: 'Test Location',
        participants: [
          { id: '1', name: 'John Doe', phone: '11987654321', email: 'john@test.com', status: 'confirmed' },
          { id: '2', name: 'Jane Smith', phone: '11987654322', email: 'jane@test.com', status: 'confirmed' },
          { id: '3', name: 'Bob Wilson', phone: '11987654323', email: 'bob@test.com', status: 'pending' }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(event);
      mockMessagingService.sendEventReminder.mockResolvedValue({ success: true, messageId: 'msg123' });

      const result = await sendEventReminderUseCase.execute(eventId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('2 successful, 0 failed');
      expect(result.data.total).toBe(2);
      expect(result.data.sent).toBe(2);
      expect(result.data.failed).toBe(0);
      expect(mockMessagingService.sendEventReminder).toHaveBeenCalledTimes(2);
      expect(mockMessagingService.sendEventReminder).toHaveBeenCalledWith({
        to: '11987654321',
        name: 'John Doe',
        eventTitle: 'Test Event',
        eventDate: event.dateTime,
        eventLocal: 'Test Location'
      });
      expect(mockMessagingService.sendEventReminder).toHaveBeenCalledWith({
        to: '11987654322',
        name: 'Jane Smith',
        eventTitle: 'Test Event',
        eventDate: event.dateTime,
        eventLocal: 'Test Location'
      });
    });

    it('should handle partial failures gracefully', async () => {
      const eventId = '456';
      const event = {
        id: eventId,
        title: 'Workshop',
        dateTime: new Date('2024-12-31T10:00:00'),
        local: 'Workshop Location',
        participants: [
          { id: '1', name: 'Alice', phone: '11987654321', email: 'alice@test.com', status: 'confirmed' },
          { id: '2', name: 'Bob', phone: '11987654322', email: 'bob@test.com', status: 'confirmed' },
          { id: '3', name: 'Charlie', phone: '11987654323', email: 'charlie@test.com', status: 'confirmed' }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(event);
      mockMessagingService.sendEventReminder
        .mockResolvedValueOnce({ success: true, messageId: 'msg1' })
        .mockResolvedValueOnce({ success: false, error: 'Invalid phone number' })
        .mockResolvedValueOnce({ success: true, messageId: 'msg3' });

      const result = await sendEventReminderUseCase.execute(eventId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('2 successful, 1 failed');
      expect(result.data.total).toBe(3);
      expect(result.data.sent).toBe(2);
      expect(result.data.failed).toBe(1);
      expect(result.data.errors).toHaveLength(1);
      expect(result.data.errors[0]).toEqual({
        participantId: '2',
        error: 'Invalid phone number'
      });
    });

    it('should handle messaging service exceptions', async () => {
      const eventId = '789';
      const event = {
        id: eventId,
        title: 'Conference',
        dateTime: new Date('2024-12-31T10:00:00'),
        local: 'Conference Hall',
        participants: [{ id: '1', name: 'David', phone: '11987654321', email: 'david@test.com', status: 'confirmed' }]
      };

      mockEventRepository.findById.mockResolvedValue(event);
      mockMessagingService.sendEventReminder.mockRejectedValue(new Error('WhatsApp API error'));

      const result = await sendEventReminderUseCase.execute(eventId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('0 successful, 1 failed');
      expect(result.data.total).toBe(1);
      expect(result.data.sent).toBe(0);
      expect(result.data.failed).toBe(1);
      expect(result.data.errors[0]).toEqual({
        participantId: '1',
        error: 'WhatsApp API error'
      });
    });
  });

  describe('Validation', () => {
    it('should return error when event ID is not provided', async () => {
      const result = await sendEventReminderUseCase.execute(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event ID is required');
      expect(mockEventRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error when messaging service is not configured', async () => {
      const useCaseWithoutMessaging = new SendEventReminderUseCase(mockEventRepository, null);

      const result = await useCaseWithoutMessaging.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Messaging service is not configured');
      expect(mockEventRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error when event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await sendEventReminderUseCase.execute('999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
      expect(mockMessagingService.sendEventReminder).not.toHaveBeenCalled();
    });

    it('should return error when event has no confirmed participants', async () => {
      const event = {
        id: '123',
        title: 'Empty Event',
        dateTime: new Date('2024-12-31T10:00:00'),
        local: 'Location',
        participants: [
          { id: '1', name: 'Pending User', phone: '11987654321', email: 'pending@test.com', status: 'pending' },
          { id: '2', name: 'Cancelled User', phone: '11987654322', email: 'cancelled@test.com', status: 'cancelled' }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(event);

      const result = await sendEventReminderUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No confirmed participants to send reminders to');
      expect(mockMessagingService.sendEventReminder).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockEventRepository.findById.mockRejectedValue(new Error('Database connection error'));

      const result = await sendEventReminderUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection error');
    });
  });
});
