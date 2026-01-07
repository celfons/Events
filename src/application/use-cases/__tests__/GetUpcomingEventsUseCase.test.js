const GetUpcomingEventsUseCase = require('../GetUpcomingEventsUseCase');

describe('GetUpcomingEventsUseCase', () => {
  let mockEventRepository;
  let getUpcomingEventsUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findAll: jest.fn()
    };
    getUpcomingEventsUseCase = new GetUpcomingEventsUseCase(mockEventRepository);
  });

  describe('Successful Retrieval', () => {
    it('should return events occurring in the next hour', async () => {
      const now = new Date();
      const futureEvent = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
      const pastEvent = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      const farFutureEvent = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

      const mockEvents = [
        {
          id: '1',
          title: 'Event in 30 minutes',
          description: 'This event will occur soon',
          dateTime: futureEvent,
          local: 'Location 1',
          isActive: true,
          participants: [
            {
              id: 'p1',
              name: 'John Doe',
              email: 'john@example.com',
              phone: '123456789',
              status: 'active'
            }
          ]
        },
        {
          id: '2',
          title: 'Past Event',
          description: 'This event already happened',
          dateTime: pastEvent,
          local: 'Location 2',
          isActive: true,
          participants: []
        },
        {
          id: '3',
          title: 'Far Future Event',
          description: 'This event is too far in the future',
          dateTime: farFutureEvent,
          local: 'Location 3',
          isActive: true,
          participants: []
        }
      ];

      mockEventRepository.findAll.mockResolvedValue(mockEvents);

      const result = await getUpcomingEventsUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Event in 30 minutes');
      expect(result.data[0].participants).toHaveLength(1);
    });

    it('should include all participants regardless of status', async () => {
      const now = new Date();
      const futureEvent = new Date(now.getTime() + 30 * 60 * 1000);

      const mockEvents = [
        {
          id: '1',
          title: 'Test Event',
          description: 'Event with mixed participants',
          dateTime: futureEvent,
          local: 'Test Location',
          isActive: true,
          participants: [
            {
              id: 'p1',
              name: 'Active User',
              email: 'active@example.com',
              phone: '111111111',
              status: 'active'
            },
            {
              id: 'p2',
              name: 'Cancelled User',
              email: 'cancelled@example.com',
              phone: '222222222',
              status: 'cancelled'
            }
          ]
        }
      ];

      mockEventRepository.findAll.mockResolvedValue(mockEvents);

      const result = await getUpcomingEventsUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.data[0].participants).toHaveLength(2);
      expect(result.data[0].participants[0].name).toBe('Active User');
      expect(result.data[0].participants[1].name).toBe('Cancelled User');
    });

    it('should filter out inactive events', async () => {
      const now = new Date();
      const futureEvent = new Date(now.getTime() + 30 * 60 * 1000);

      const mockEvents = [
        {
          id: '1',
          title: 'Active Event',
          description: 'This event is active',
          dateTime: futureEvent,
          local: 'Location 1',
          isActive: true,
          participants: []
        },
        {
          id: '2',
          title: 'Inactive Event',
          description: 'This event is inactive',
          dateTime: futureEvent,
          local: 'Location 2',
          isActive: false,
          participants: []
        }
      ];

      mockEventRepository.findAll.mockResolvedValue(mockEvents);

      const result = await getUpcomingEventsUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Active Event');
    });

    it('should return empty array when no upcoming events', async () => {
      mockEventRepository.findAll.mockResolvedValue([]);

      const result = await getUpcomingEventsUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockEventRepository.findAll.mockRejectedValue(new Error('Database error'));

      const result = await getUpcomingEventsUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
