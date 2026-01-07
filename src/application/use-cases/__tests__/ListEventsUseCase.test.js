const ListEventsUseCase = require('../ListEventsUseCase');

describe('ListEventsUseCase', () => {
  let mockEventRepository;
  let listEventsUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findAll: jest.fn()
    };
    listEventsUseCase = new ListEventsUseCase(mockEventRepository);
  });

  describe('Successful Listing', () => {
    it('should return all events successfully', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Event 1',
          description: 'Description 1',
          dateTime: new Date('2024-12-31'),
          totalSlots: 50,
          availableSlots: 30,
          toJSON: jest.fn().mockReturnValue({
            id: '1',
            title: 'Event 1',
            description: 'Description 1',
            dateTime: new Date('2024-12-31'),
            totalSlots: 50,
            availableSlots: 30
          })
        },
        {
          id: '2',
          title: 'Event 2',
          description: 'Description 2',
          dateTime: new Date('2024-12-25'),
          totalSlots: 100,
          availableSlots: 80,
          toJSON: jest.fn().mockReturnValue({
            id: '2',
            title: 'Event 2',
            description: 'Description 2',
            dateTime: new Date('2024-12-25'),
            totalSlots: 100,
            availableSlots: 80
          })
        }
      ];

      mockEventRepository.findAll.mockResolvedValue(mockEvents);

      const result = await listEventsUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].title).toBe('Event 1');
      expect(result.data[1].title).toBe('Event 2');
      expect(mockEventRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no events exist', async () => {
      mockEventRepository.findAll.mockResolvedValue([]);

      const result = await listEventsUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(mockEventRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should call toJSON on each event', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Event 1',
          toJSON: jest.fn().mockReturnValue({ id: '1', title: 'Event 1' })
        },
        {
          id: '2',
          title: 'Event 2',
          toJSON: jest.fn().mockReturnValue({ id: '2', title: 'Event 2' })
        }
      ];

      mockEventRepository.findAll.mockResolvedValue(mockEvents);

      await listEventsUseCase.execute();

      expect(mockEvents[0].toJSON).toHaveBeenCalled();
      expect(mockEvents[1].toJSON).toHaveBeenCalled();
    });

    it('should return events in the order provided by repository', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Newer Event',
          dateTime: new Date('2025-01-15'),
          toJSON: jest.fn().mockReturnValue({
            id: '1',
            title: 'Newer Event',
            dateTime: new Date('2025-01-15')
          })
        },
        {
          id: '2',
          title: 'Older Event',
          dateTime: new Date('2025-01-10'),
          toJSON: jest.fn().mockReturnValue({
            id: '2',
            title: 'Older Event',
            dateTime: new Date('2025-01-10')
          })
        }
      ];

      mockEventRepository.findAll.mockResolvedValue(mockEvents);

      const result = await listEventsUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].title).toBe('Newer Event');
      expect(result.data[1].title).toBe('Older Event');
    });

    it('should only return active events from repository', async () => {
      // The repository is responsible for filtering out inactive events
      // This test verifies that the use case properly handles the data from repository
      const mockEvents = [
        {
          id: '1',
          title: 'Active Event',
          isActive: true,
          toJSON: jest.fn().mockReturnValue({
            id: '1',
            title: 'Active Event',
            isActive: true
          })
        },
        {
          id: '2',
          title: 'Another Active Event',
          isActive: true,
          toJSON: jest.fn().mockReturnValue({
            id: '2',
            title: 'Another Active Event',
            isActive: true
          })
        }
      ];

      mockEventRepository.findAll.mockResolvedValue(mockEvents);

      const result = await listEventsUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data.every(event => event.isActive === true)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockEventRepository.findAll.mockRejectedValue(new Error('Database connection error'));

      const result = await listEventsUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection error');
    });

    it('should handle unexpected errors', async () => {
      mockEventRepository.findAll.mockRejectedValue(new Error('Unexpected error'));

      const result = await listEventsUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });
  });
});
