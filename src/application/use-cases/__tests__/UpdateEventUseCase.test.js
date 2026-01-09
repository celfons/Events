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
        availableSlots: 30,
        participants: [
          { id: '1', name: 'John', email: 'john@test.com', status: 'confirmed' },
          { id: '2', name: 'Jane', email: 'jane@test.com', status: 'confirmed' }
        ]
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
        availableSlots: 98,
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
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, {
        ...updateData,
        availableSlots: 98
      });
    });

    it('should update only provided fields', async () => {
      const eventId = '456';
      const existingEvent = {
        id: eventId,
        title: 'Original Title',
        description: 'Original Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 40,
        participants: []
      };

      const updateData = {
        title: 'Updated Title'
      };

      const updatedEvent = {
        ...existingEvent,
        title: 'Updated Title',
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          title: 'Updated Title',
          description: 'Original Description',
          dateTime: new Date('2024-12-31'),
          totalSlots: 50,
          availableSlots: 40
        })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, updateData);
    });

    it('should update local field', async () => {
      const eventId = '456';
      const existingEvent = {
        id: eventId,
        title: 'Original Title',
        description: 'Original Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 40,
        participants: [],
        local: 'Old Location'
      };

      const updateData = {
        local: 'New Conference Center'
      };

      const updatedEvent = {
        ...existingEvent,
        local: 'New Conference Center',
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          title: 'Original Title',
          description: 'Original Description',
          dateTime: new Date('2024-12-31'),
          totalSlots: 50,
          availableSlots: 40,
          local: 'New Conference Center'
        })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(result.data.local).toBe('New Conference Center');
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, updateData);
    });

    it('should allow updating availableSlots without totalSlots', async () => {
      const eventId = '789';
      const existingEvent = {
        id: eventId,
        title: 'Test Event',
        description: 'Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 40,
        participants: []
      };

      const updateData = {
        availableSlots: 35
      };

      const updatedEvent = {
        ...existingEvent,
        availableSlots: 35,
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          title: 'Test Event',
          description: 'Description',
          dateTime: new Date('2024-12-31'),
          totalSlots: 50,
          availableSlots: 35
        })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, updateData);
    });

    it('should update isActive field', async () => {
      const eventId = '890';
      const existingEvent = {
        id: eventId,
        title: 'Test Event',
        description: 'Description',
        dateTime: new Date('2024-12-31'),
        totalSlots: 50,
        availableSlots: 40,
        participants: [],
        isActive: true
      };

      const updateData = {
        isActive: false
      };

      const updatedEvent = {
        ...existingEvent,
        isActive: false,
        toJSON: jest.fn().mockReturnValue({
          id: eventId,
          title: 'Test Event',
          description: 'Description',
          dateTime: new Date('2024-12-31'),
          totalSlots: 50,
          availableSlots: 40,
          isActive: false
        })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(result.data.isActive).toBe(false);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, updateData);
    });
  });

  describe('Validation', () => {
    it('should return error when event ID is missing', async () => {
      const result = await updateEventUseCase.execute(null, { title: 'New Title' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event ID is required');
    });

    it('should return error when event does not exist', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await updateEventUseCase.execute('999', { title: 'New Title' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
    });

    it('should return error when title is empty', async () => {
      const existingEvent = { id: '123', title: 'Test', participants: [] };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { title: '   ' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Title is required');
    });

    it('should return error when description is empty', async () => {
      const existingEvent = { id: '123', description: 'Test', participants: [] };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { description: '   ' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Description is required');
    });

    it('should return error when dateTime is invalid', async () => {
      const existingEvent = { id: '123', dateTime: new Date(), participants: [] };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { dateTime: 'invalid-date' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date format');
    });

    it('should return error when totalSlots is less than 1', async () => {
      const existingEvent = { id: '123', totalSlots: 10, participants: [] };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', { totalSlots: 0 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Total slots must be at least 1');
    });

    it('should return error when manually setting availableSlots with totalSlots', async () => {
      const existingEvent = { id: '123', totalSlots: 50, participants: [] };
      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('123', {
        totalSlots: 100,
        availableSlots: 50
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot manually set availableSlots');
    });
  });

  describe('Total Slots Update with Participant Validation', () => {
    it('should update totalSlots and availableSlots based on active participants', async () => {
      const existingEvent = {
        id: '123',
        title: 'Test Event',
        totalSlots: 50,
        availableSlots: 45,
        participants: [
          { id: '1', name: 'John', email: 'john@test.com', status: 'confirmed' },
          { id: '2', name: 'Jane', email: 'jane@test.com', status: 'confirmed' },
          { id: '3', name: 'Bob', email: 'bob@test.com', status: 'confirmed' },
          { id: '4', name: 'Alice', email: 'alice@test.com', status: 'confirmed' },
          { id: '5', name: 'Charlie', email: 'charlie@test.com', status: 'confirmed' }
        ]
      };

      const updatedEvent = {
        ...existingEvent,
        totalSlots: 100,
        availableSlots: 95,
        toJSON: jest.fn().mockReturnValue({
          id: '123',
          totalSlots: 100,
          availableSlots: 95
        })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute('123', { totalSlots: 100 });

      expect(result.success).toBe(true);
      expect(mockEventRepository.update).toHaveBeenCalledWith('123', {
        totalSlots: 100,
        availableSlots: 95
      });
    });

    it('should update totalSlots when reducing but still accommodating all participants', async () => {
      const existingEvent = {
        id: '456',
        title: 'Test Event',
        totalSlots: 100,
        availableSlots: 90,
        participants: [
          { id: '1', name: 'John', email: 'john@test.com', status: 'confirmed' },
          { id: '2', name: 'Jane', email: 'jane@test.com', status: 'confirmed' },
          { id: '3', name: 'Bob', email: 'bob@test.com', status: 'confirmed' }
        ]
      };

      const updatedEvent = {
        ...existingEvent,
        totalSlots: 50,
        availableSlots: 47,
        toJSON: jest.fn().mockReturnValue({
          id: '456',
          totalSlots: 50,
          availableSlots: 47
        })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute('456', { totalSlots: 50 });

      expect(result.success).toBe(true);
      expect(mockEventRepository.update).toHaveBeenCalledWith('456', {
        totalSlots: 50,
        availableSlots: 47
      });
    });

    it('should reject totalSlots update when it would be less than active participants count', async () => {
      const existingEvent = {
        id: '789',
        title: 'Test Event',
        totalSlots: 50,
        availableSlots: 45,
        participants: [
          { id: '1', name: 'John', email: 'john@test.com', status: 'confirmed' },
          { id: '2', name: 'Jane', email: 'jane@test.com', status: 'confirmed' },
          { id: '3', name: 'Bob', email: 'bob@test.com', status: 'confirmed' },
          { id: '4', name: 'Alice', email: 'alice@test.com', status: 'confirmed' },
          { id: '5', name: 'Charlie', email: 'charlie@test.com', status: 'confirmed' }
        ]
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);

      const result = await updateEventUseCase.execute('789', { totalSlots: 3 });

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Cannot reduce total slots to 3. There are 5 active participants. Please remove 2 participant(s) first.'
      );
    });

    it('should allow totalSlots update when equal to active participants count', async () => {
      const existingEvent = {
        id: '999',
        title: 'Test Event',
        totalSlots: 50,
        availableSlots: 45,
        participants: [
          { id: '1', name: 'John', email: 'john@test.com', status: 'confirmed' },
          { id: '2', name: 'Jane', email: 'jane@test.com', status: 'confirmed' },
          { id: '3', name: 'Bob', email: 'bob@test.com', status: 'confirmed' },
          { id: '4', name: 'Alice', email: 'alice@test.com', status: 'confirmed' },
          { id: '5', name: 'Charlie', email: 'charlie@test.com', status: 'confirmed' }
        ]
      };

      const updatedEvent = {
        ...existingEvent,
        totalSlots: 5,
        availableSlots: 0,
        toJSON: jest.fn().mockReturnValue({
          id: '999',
          totalSlots: 5,
          availableSlots: 0
        })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute('999', { totalSlots: 5 });

      expect(result.success).toBe(true);
      expect(mockEventRepository.update).toHaveBeenCalledWith('999', {
        totalSlots: 5,
        availableSlots: 0
      });
    });

    it('should ignore cancelled participants when counting', async () => {
      const existingEvent = {
        id: '111',
        title: 'Test Event',
        totalSlots: 50,
        availableSlots: 48,
        participants: [
          { id: '1', name: 'John', email: 'john@test.com', status: 'confirmed' },
          { id: '2', name: 'Jane', email: 'jane@test.com', status: 'cancelled' },
          { id: '3', name: 'Bob', email: 'bob@test.com', status: 'confirmed' }
        ]
      };

      const updatedEvent = {
        ...existingEvent,
        totalSlots: 10,
        availableSlots: 8,
        toJSON: jest.fn().mockReturnValue({
          id: '111',
          totalSlots: 10,
          availableSlots: 8
        })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCase.execute('111', { totalSlots: 10 });

      expect(result.success).toBe(true);
      expect(mockEventRepository.update).toHaveBeenCalledWith('111', {
        totalSlots: 10,
        availableSlots: 8
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockEventRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await updateEventUseCase.execute('123', { title: 'New Title' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
