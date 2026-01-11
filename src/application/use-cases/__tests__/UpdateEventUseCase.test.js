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

  describe('WhatsApp Notifications', () => {
    let mockMessagingService;

    beforeEach(() => {
      mockMessagingService = {
        sendEventUpdate: jest.fn().mockResolvedValue({ success: true })
      };
    });

    it('should send WhatsApp notifications when event date changes', async () => {
      const updateEventUseCaseWithMessaging = new UpdateEventUseCase(mockEventRepository, mockMessagingService);

      const eventId = '123';
      const existingEvent = {
        id: eventId,
        title: 'Test Event',
        dateTime: new Date('2024-12-31T10:00:00'),
        local: 'Original Location',
        participants: [
          { id: '1', name: 'John Doe', phone: '11987654321', email: 'john@test.com', status: 'confirmed' },
          { id: '2', name: 'Jane Smith', phone: '11987654322', email: 'jane@test.com', status: 'confirmed' }
        ]
      };

      const updateData = {
        dateTime: new Date('2025-01-15T14:00:00')
      };

      const updatedEvent = {
        ...existingEvent,
        dateTime: updateData.dateTime,
        toJSON: jest.fn().mockReturnValue({ ...existingEvent, dateTime: updateData.dateTime })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCaseWithMessaging.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(mockMessagingService.sendEventUpdate).toHaveBeenCalledTimes(2);
      expect(mockMessagingService.sendEventUpdate).toHaveBeenCalledWith({
        to: '11987654321',
        name: 'John Doe',
        eventTitle: 'Test Event',
        newDate: updateData.dateTime,
        newLocal: null
      });
      expect(mockMessagingService.sendEventUpdate).toHaveBeenCalledWith({
        to: '11987654322',
        name: 'Jane Smith',
        eventTitle: 'Test Event',
        newDate: updateData.dateTime,
        newLocal: null
      });
    });

    it('should send WhatsApp notifications when event location changes', async () => {
      const updateEventUseCaseWithMessaging = new UpdateEventUseCase(mockEventRepository, mockMessagingService);

      const eventId = '456';
      const existingEvent = {
        id: eventId,
        title: 'Workshop Event',
        dateTime: new Date('2024-12-31T10:00:00'),
        local: 'Original Location',
        participants: [{ id: '1', name: 'Alice', phone: '11987654321', email: 'alice@test.com', status: 'confirmed' }]
      };

      const updateData = {
        local: 'New Location Building'
      };

      const updatedEvent = {
        ...existingEvent,
        local: updateData.local,
        toJSON: jest.fn().mockReturnValue({ ...existingEvent, local: updateData.local })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCaseWithMessaging.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(mockMessagingService.sendEventUpdate).toHaveBeenCalledTimes(1);
      expect(mockMessagingService.sendEventUpdate).toHaveBeenCalledWith({
        to: '11987654321',
        name: 'Alice',
        eventTitle: 'Workshop Event',
        newDate: null,
        newLocal: 'New Location Building'
      });
    });

    it('should send WhatsApp notifications when both date and location change', async () => {
      const updateEventUseCaseWithMessaging = new UpdateEventUseCase(mockEventRepository, mockMessagingService);

      const eventId = '789';
      const existingEvent = {
        id: eventId,
        title: 'Conference',
        dateTime: new Date('2024-12-31T10:00:00'),
        local: 'Old Venue',
        participants: [{ id: '1', name: 'Bob', phone: '11987654321', email: 'bob@test.com', status: 'confirmed' }]
      };

      const updateData = {
        dateTime: new Date('2025-01-20T09:00:00'),
        local: 'New Convention Center'
      };

      const updatedEvent = {
        ...existingEvent,
        ...updateData,
        toJSON: jest.fn().mockReturnValue({ ...existingEvent, ...updateData })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCaseWithMessaging.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(mockMessagingService.sendEventUpdate).toHaveBeenCalledTimes(1);
      expect(mockMessagingService.sendEventUpdate).toHaveBeenCalledWith({
        to: '11987654321',
        name: 'Bob',
        eventTitle: 'Conference',
        newDate: updateData.dateTime,
        newLocal: 'New Convention Center'
      });
    });

    it('should not send WhatsApp notifications when date and location do not change', async () => {
      const updateEventUseCaseWithMessaging = new UpdateEventUseCase(mockEventRepository, mockMessagingService);

      const eventId = '999';
      const existingEvent = {
        id: eventId,
        title: 'Meetup',
        dateTime: new Date('2024-12-31T10:00:00'),
        local: 'Same Location',
        participants: [
          { id: '1', name: 'Charlie', phone: '11987654321', email: 'charlie@test.com', status: 'confirmed' }
        ]
      };

      const updateData = {
        title: 'Updated Meetup Title'
      };

      const updatedEvent = {
        ...existingEvent,
        title: updateData.title,
        toJSON: jest.fn().mockReturnValue({ ...existingEvent, title: updateData.title })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCaseWithMessaging.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(mockMessagingService.sendEventUpdate).not.toHaveBeenCalled();
    });

    it('should only notify confirmed participants', async () => {
      const updateEventUseCaseWithMessaging = new UpdateEventUseCase(mockEventRepository, mockMessagingService);

      const eventId = '111';
      const existingEvent = {
        id: eventId,
        title: 'Test Event',
        dateTime: new Date('2024-12-31T10:00:00'),
        local: 'Location',
        participants: [
          { id: '1', name: 'Confirmed User', phone: '11987654321', email: 'confirmed@test.com', status: 'confirmed' },
          { id: '2', name: 'Pending User', phone: '11987654322', email: 'pending@test.com', status: 'pending' },
          { id: '3', name: 'Cancelled User', phone: '11987654323', email: 'cancelled@test.com', status: 'cancelled' }
        ]
      };

      const updateData = {
        dateTime: new Date('2025-01-15T14:00:00')
      };

      const updatedEvent = {
        ...existingEvent,
        dateTime: updateData.dateTime,
        toJSON: jest.fn().mockReturnValue({ ...existingEvent, dateTime: updateData.dateTime })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCaseWithMessaging.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(mockMessagingService.sendEventUpdate).toHaveBeenCalledTimes(1);
      expect(mockMessagingService.sendEventUpdate).toHaveBeenCalledWith({
        to: '11987654321',
        name: 'Confirmed User',
        eventTitle: 'Test Event',
        newDate: updateData.dateTime,
        newLocal: null
      });
    });

    it('should continue successfully even if WhatsApp notification fails', async () => {
      const updateEventUseCaseWithMessaging = new UpdateEventUseCase(mockEventRepository, mockMessagingService);
      mockMessagingService.sendEventUpdate.mockRejectedValue(new Error('WhatsApp API error'));

      const eventId = '222';
      const existingEvent = {
        id: eventId,
        title: 'Test Event',
        dateTime: new Date('2024-12-31T10:00:00'),
        local: 'Location',
        participants: [{ id: '1', name: 'User', phone: '11987654321', email: 'user@test.com', status: 'confirmed' }]
      };

      const updateData = {
        dateTime: new Date('2025-01-15T14:00:00')
      };

      const updatedEvent = {
        ...existingEvent,
        dateTime: updateData.dateTime,
        toJSON: jest.fn().mockReturnValue({ ...existingEvent, dateTime: updateData.dateTime })
      };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await updateEventUseCaseWithMessaging.execute(eventId, updateData);

      expect(result.success).toBe(true);
      expect(mockMessagingService.sendEventUpdate).toHaveBeenCalled();
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
