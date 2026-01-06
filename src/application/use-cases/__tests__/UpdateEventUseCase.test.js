const UpdateEventUseCase = require('../UpdateEventUseCase');

describe('UpdateEventUseCase', () => {
  let mockEventRepository;
  let updateEventUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn(),
      update: jest.fn()
    };
    updateEventUseCase = new UpdateEventUseCase(mockEventRepository);
  });

  describe('Successful Update', () => {
    it('should update event successfully with valid data', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        title: 'Old Title',
        description: 'Old Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 30
      };

      const updateData = {
        title: 'New Title',
        description: 'New Description',
        dateTime: '2024-12-31',
        totalSlots: 100
      };

      const updatedEvent = {
        id: eventId,
        title: 'New Title',
        description: 'New Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 100,
        availableSlots: 30,
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          title: 'New Title',
          description: 'New Description',
          dateTime: new Date('2024-12-31'),
          totalSlots: 100,
          availableSlots: 30
        })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('New Title');
      expect(mockEventRepository.findById).toHaveBeenCalledWith(eventId);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, updateData);
    });

    it('should update only provided fields', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        title: 'Old Title'
      };

      const updateData = {
        title: 'New Title'
      };

      const updatedEvent = {
        id: eventId,
        title: 'New Title',
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          title: 'New Title'
        })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, updateData);
    });
  });

  describe('Validation', () => {
    it('should return error if event ID is not provided', async () => {
      const result = await updateEventUseCase.execute('', { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event ID is required');
      expect(mockEventRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error if event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await updateEventUseCase.execute('123', { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });

    it('should return error if title is empty string', async () => {
      const existingEvent = { id: '123', title: 'Old Title' };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { title: '   ' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Title is required');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });

    it('should return error if description is empty string', async () => {
      const existingEvent = { id: '123', description: 'Old Desc' };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { description: '   ' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Description is required');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });

    it('should return error if dateTime is invalid', async () => {
      const existingEvent = { id: '123', dateTime: new Date() };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { dateTime: 'invalid-date' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date format');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });

    it('should return error if totalSlots is less than 1', async () => {
      const existingEvent = { id: '123', totalSlots: 50 };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { totalSlots: 0 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Total slots must be at least 1');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockEventRepository.findById.mockRejectedValue(new Error('Database connection error'));

      const result = await updateEventUseCase.execute('123', { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection error');
    });

    it('should handle update errors gracefully', async () => {
      const existingEvent = { id: '123', title: 'Old Title' };
      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockRejectedValue(new Error('Update failed'));

      const result = await updateEventUseCase.execute('123', { title: 'New Title' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });
});
