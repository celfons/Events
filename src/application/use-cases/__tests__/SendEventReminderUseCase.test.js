const SendEventReminderUseCase = require('../SendEventReminderUseCase');

describe('SendEventReminderUseCase', () => {
  let mockEventRepository;
  let mockMessagingService;
  let sendEventReminderUseCase;

  // Helper function to create a mock event
  const createMockEvent = (overrides = {}) => ({
    id: '123',
    title: 'Test Event',
    dateTime: new Date('2024-12-31T10:00:00'),
    local: 'Test Location',
    participants: [{ id: '1', name: 'John Doe', phone: '11987654321', email: 'john@test.com', status: 'confirmed' }],
    ...overrides
  });

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
      const event = createMockEvent({
        participants: [
          { id: '1', name: 'John Doe', phone: '11987654321', email: 'john@test.com', status: 'confirmed' },
          { id: '2', name: 'Jane Smith', phone: '11987654322', email: 'jane@test.com', status: 'confirmed' },
          { id: '3', name: 'Bob Wilson', phone: '11987654323', email: 'bob@test.com', status: 'pending' }
        ]
      });

      mockEventRepository.findById.mockResolvedValue(event);
      mockMessagingService.sendEventReminder.mockResolvedValue({ success: true, messageId: 'msg123' });

      const result = await sendEventReminderUseCase.execute(event.id);

      expect(result.success).toBe(true);
      expect(result.message).toContain('2 successful, 0 failed');
      expect(result.data).toMatchObject({ total: 2, sent: 2, failed: 0 });
      expect(mockMessagingService.sendEventReminder).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures gracefully', async () => {
      const event = createMockEvent({
        participants: [
          { id: '1', name: 'Alice', phone: '11987654321', email: 'alice@test.com', status: 'confirmed' },
          { id: '2', name: 'Bob', phone: '11987654322', email: 'bob@test.com', status: 'confirmed' },
          { id: '3', name: 'Charlie', phone: '11987654323', email: 'charlie@test.com', status: 'confirmed' }
        ]
      });

      mockEventRepository.findById.mockResolvedValue(event);
      mockMessagingService.sendEventReminder
        .mockResolvedValueOnce({ success: true, messageId: 'msg1' })
        .mockResolvedValueOnce({ success: false, error: 'Invalid phone number' })
        .mockResolvedValueOnce({ success: true, messageId: 'msg3' });

      const result = await sendEventReminderUseCase.execute(event.id);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({ total: 3, sent: 2, failed: 1 });
      expect(result.data.errors).toContainEqual({ participantId: '2', error: 'Invalid phone number' });
    });

    it('should handle messaging service exceptions', async () => {
      const event = createMockEvent();
      mockEventRepository.findById.mockResolvedValue(event);
      mockMessagingService.sendEventReminder.mockRejectedValue(new Error('WhatsApp API error'));

      const result = await sendEventReminderUseCase.execute(event.id);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({ total: 1, sent: 0, failed: 1 });
      expect(result.data.errors[0]).toMatchObject({ participantId: '1', error: 'WhatsApp API error' });
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
    });

    it('should return error when event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);
      const result = await sendEventReminderUseCase.execute('999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
    });

    it('should return error when event has no confirmed participants', async () => {
      const event = createMockEvent({
        participants: [
          { id: '1', name: 'Pending User', phone: '11987654321', email: 'pending@test.com', status: 'pending' }
        ]
      });
      mockEventRepository.findById.mockResolvedValue(event);

      const result = await sendEventReminderUseCase.execute('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No confirmed participants to send reminders to');
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
