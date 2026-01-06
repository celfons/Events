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
      ,
        createdBy: 'user123'
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
        availableSlots: 98, // 100 - 2 active participants
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          title: 'New Title',
          description: 'New Description',
          dateTime: new Date('2024-12-31'),
          totalSlots: 100,
          availableSlots: 98
        })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue([
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' }
      ]); // 2 active participants
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, updateData, "user123");

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('New Title');
      expect(mockEventRepository.findById).toHaveBeenCalledWith(eventId);
      // Check that availableSlots was added to the update data
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, {
        ...updateData,
        availableSlots: 98 // 100 - 2 active participants
      });
    });

    it('should update only provided fields', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        title: 'Old Title'
      ,
        createdBy: 'user123'
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

      const result = await updateEventUseCase.execute(eventId, updateData, "user123");

      expect(result.success).toBe(true);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, updateData);
    });

    it('should allow updating availableSlots without totalSlots', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        totalSlots: 50,
        availableSlots: 30
      ,
        createdBy: 'user123'
      };

      const updateData = {
        availableSlots: 25
      };

      const updatedEvent = {
        id: eventId,
        totalSlots: 50,
        availableSlots: 25,
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          totalSlots: 50,
          availableSlots: 25
        })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, updateData, "user123");

      expect(result.success).toBe(true);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, updateData);
    });
  });

  describe('Validation', () => {
    it('should return error if event ID is not provided', async () => {
      const result = await updateEventUseCase.execute('', {}, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event ID is required');
    });

    it('should return error if userId is not provided', async () => {
      const result = await updateEventUseCase.execute('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should return error if user is not the owner', async () => {
      const existingEvent = { id: '123', title: 'Test', createdBy: 'owner123' };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { title: 'New' }, 'user456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('You do not have permission to update this event');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });

    it('should return error if event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await updateEventUseCase.execute('123', { title: 'Test' }, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });

    it('should return error if title is empty string', async () => {
      const existingEvent = { id: '123', title: 'Old Title' ,
        createdBy: 'user123'
      };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { title: '   ' }, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Title is required');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });

    it('should return error if description is empty string', async () => {
      const existingEvent = { id: '123', description: 'Old Desc' ,
        createdBy: 'user123'
      };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { description: '   ' }, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Description is required');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });

    it('should return error if dateTime is invalid', async () => {
      const existingEvent = { id: '123', dateTime: new Date() ,
        createdBy: 'user123'
      };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { dateTime: 'invalid-date' }, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date format');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });

    it('should return error if totalSlots is less than 1', async () => {
      const existingEvent = { id: '123', totalSlots: 50 ,
        createdBy: 'user123'
      };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { totalSlots: 0 }, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Total slots must be at least 1');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });

    it('should return error if both totalSlots and availableSlots are provided', async () => {
      const existingEvent = { id: '123', totalSlots: 50, availableSlots: 30 ,
        createdBy: 'user123'
      };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { totalSlots: 100, availableSlots: 80 }, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot manually set availableSlots when updating totalSlots. availableSlots will be calculated automatically.');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('Total Slots Update with Participant Validation', () => {
    it('should update totalSlots and availableSlots based on active participants', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        totalSlots: 50,
        availableSlots: 30 // 20 occupied slots (but may not match actual participants)
      ,
        createdBy: 'user123'
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue([
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' }
      ]); // 2 active participants

      const updatedEvent = {
        id: eventId,
        totalSlots: 100,
        availableSlots: 98, // 100 - 2 active participants
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          totalSlots: 100,
          availableSlots: 98
        })
      };

      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, { totalSlots: 100 }, 'user123');

      expect(result.success).toBe(true);
      expect(result.data.availableSlots).toBe(98);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, {
        totalSlots: 100,
        availableSlots: 98
      });
    });

    it('should update totalSlots when reducing but still accommodating all participants', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        totalSlots: 100,
        availableSlots: 70 // 30 occupied slots (but may not match actual participants)
      ,
        createdBy: 'user123'
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
        availableSlots: 47, // 50 - 3 active participants
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          totalSlots: 50,
          availableSlots: 47
        })
      };

      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, { totalSlots: 50 }, 'user123');

      expect(result.success).toBe(true);
      expect(result.data.availableSlots).toBe(47);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, {
        totalSlots: 50,
        availableSlots: 47
      });
    });

    it('should reject totalSlots update when it would be less than active participants count', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        totalSlots: 50,
        availableSlots: 30 // 20 occupied slots
      ,
        createdBy: 'user123'
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockRegistrationRepository.findByEventId.mockResolvedValue([
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
        { id: '3', name: 'User 3' },
        { id: '4', name: 'User 4' },
        { id: '5', name: 'User 5' }
      ]); // 5 active participants

      const result = await updateEventUseCase.execute(eventId, { totalSlots: 3 }, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot reduce total slots to 3. There are 5 active participants. Please remove 2 participant(s) first.');
      expect(mockEventRepository.update).not.toHaveBeenCalled();
    });

    it('should allow totalSlots update when equal to active participants count', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        totalSlots: 50,
        availableSlots: 45 // 5 occupied slots (but actual participants may differ)
      ,
        createdBy: 'user123'
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
        availableSlots: 0, // 3 - 3 active participants = 0
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          totalSlots: 3,
          availableSlots: 0
        })
      };

      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, { totalSlots: 3 }, 'user123');

      expect(result.success).toBe(true);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, {
        totalSlots: 3,
        availableSlots: 0 // 3 - 3 active participants
      });
    });

    it('should not check participants when totalSlots is not being updated', async () => {
      const eventId = '123';
      const existingEvent = {
        id: eventId,
        title: 'Old Title',
        totalSlots: 50,
        availableSlots: 30
      ,
        createdBy: 'user123'
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

      const result = await updateEventUseCase.execute(eventId, { title: 'New Title' }, 'user123');

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
      ,
        createdBy: 'user123'
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

      const result = await updateEventUseCase.execute(eventId, { title: 'New Title', totalSlots: 50 }, 'user123');

      expect(result.success).toBe(true);
      expect(mockRegistrationRepository.findByEventId).not.toHaveBeenCalled();
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, { title: 'New Title', totalSlots: 50 });
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockEventRepository.findById.mockRejectedValue(new Error('Database connection error'));

      const result = await updateEventUseCase.execute('123', { title: 'Test' }, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection error');
    });

    it('should handle update errors gracefully', async () => {
      const existingEvent = { id: '123', title: 'Old Title' ,
        createdBy: 'user123'
      };
      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockRejectedValue(new Error('Update failed'));

      const result = await updateEventUseCase.execute('123', { title: 'New Title' }, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });
});
