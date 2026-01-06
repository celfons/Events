const UpdateEventUseCase = require('../UpdateEventUseCase');

describe('UpdateEventUseCase', () => {
  let mockEventRepository;
  let mockRegistrationRepository;
  let updateEventUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findById: jest.fn(),
      update: jest.fn()
    };
    mockRegistrationRepository = {
      findByEventId: jest.fn()
    };
    updateEventUseCase = new UpdateEventUseCase(mockEventRepository, mockRegistrationRepository);
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
        availableSlots: 80, // Should be updated: (100 - (50 - 30)) = 80
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          title: 'New Title',
          description: 'New Description',
          dateTime: new Date('2024-12-31'),
          totalSlots: 100,
          availableSlots: 80
        })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue([
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' }
      ]); // 2 active participants
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('New Title');
      expect(mockEventRepository.findById).toHaveBeenCalledWith(eventId);
      // Check that availableSlots was added to the update data
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, {
        ...updateData,
        availableSlots: 80
      });
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

  describe('Total Slots Update with Participant Validation', () => {
    it('should update totalSlots and availableSlots proportionally when no participants exceed new limit', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        totalSlots: 50,
        availableSlots: 30 // 20 occupied slots
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue([
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' }
      ]); // 2 active participants (less than 20 occupied)

      const updatedEvent = {
        id: eventId,
        totalSlots: 100,
        availableSlots: 80, // 100 - 20 = 80
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          totalSlots: 100,
          availableSlots: 80
        })
      };

      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, { totalSlots: 100 });

      expect(result.success).toBe(true);
      expect(result.data.availableSlots).toBe(80);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, {
        totalSlots: 100,
        availableSlots: 80
      });
    });

    it('should update totalSlots when reducing but still accommodating all participants', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        totalSlots: 100,
        availableSlots: 70 // 30 occupied slots
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue([
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
        { id: '3', name: 'User 3' }
      ]); // 3 active participants

      const updatedEvent = {
        id: eventId,
        totalSlots: 50,
        availableSlots: 20, // 50 - 30 = 20
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          totalSlots: 50,
          availableSlots: 20
        })
      };

      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, { totalSlots: 50 });

      expect(result.success).toBe(true);
      expect(result.data.availableSlots).toBe(20);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, {
        totalSlots: 50,
        availableSlots: 20
      });
    });

    it('should reject totalSlots update when it would be less than active participants count', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        totalSlots: 50,
        availableSlots: 30 // 20 occupied slots
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue([
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
        { id: '3', name: 'User 3' },
        { id: '4', name: 'User 4' },
        { id: '5', name: 'User 5' }
      ]); // 5 active participants

      const result = await updateEventUseCase.execute(eventId, { totalSlots: 3 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot reduce total slots to 3. There are 5 active participants. Please remove 2 participant(s) first.');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });

    it('should allow totalSlots update when equal to active participants count', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        totalSlots: 50,
        availableSlots: 45 // 5 occupied slots
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue([
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
        { id: '3', name: 'User 3' }
      ]); // 3 active participants

      const updatedEvent = {
        id: eventId,
        totalSlots: 3,
        availableSlots: 0, // 3 - 5 = -2, but should be 0 (no available slots)
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          totalSlots: 3,
          availableSlots: 0
        })
      };

      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, { totalSlots: 3 });

      expect(result.success).toBe(true);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, {
        totalSlots: 3,
        availableSlots: -2 // This will be calculated as 3 - 5 = -2
      });
    });

    it('should not check participants when totalSlots is not being updated', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        title: 'Old Title',
        totalSlots: 50,
        availableSlots: 30
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const updatedEvent = {
        id: eventId,
        title: 'New Title',
        totalSlots: 50,
        availableSlots: 30,
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          title: 'New Title',
          totalSlots: 50,
          availableSlots: 30
        })
      };

      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, { title: 'New Title' });

      expect(result.success).toBe(true);
      expect(mockRegistrationRepository.findByEventId).not.toHaveBeenCalled();
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, { title: 'New Title' });
    });

    it('should not check participants when totalSlots value remains the same', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        title: 'Old Title',
        totalSlots: 50,
        availableSlots: 30
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const updatedEvent = {
        id: eventId,
        title: 'New Title',
        totalSlots: 50,
        availableSlots: 30,
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          title: 'New Title',
          totalSlots: 50,
          availableSlots: 30
        })
      };

      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, { title: 'New Title', totalSlots: 50 });

      expect(result.success).toBe(true);
      expect(mockRegistrationRepository.findByEventId).not.toHaveBeenCalled();
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, { title: 'New Title', totalSlots: 50 });
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
