const ListUserEventsUseCase = require('../ListUserEventsUseCase');

describe('ListUserEventsUseCase', () => {
  let mockEventRepository;
  let listUserEventsUseCase;

  beforeEach(() => {
    mockEventRepository = {
      findByUserId: jest.fn()
    };
    listUserEventsUseCase = new ListUserEventsUseCase(mockEventRepository);
  });

  test('should list events for a specific user', async () => {
    const userId = 'user123';
    const mockEvents = [
      {
        id: '1',
        title: 'Event 1',
        description: 'Description 1',
        dateTime: new Date('2024-12-31'),
        totalSlots: 100,
        availableSlots: 50,
        userId: userId,
        toJSON: () => ({
          id: '1',
          title: 'Event 1',
          description: 'Description 1',
          dateTime: new Date('2024-12-31'),
          totalSlots: 100,
          availableSlots: 50,
          userId: userId
        })
      },
      {
        id: '2',
        title: 'Event 2',
        description: 'Description 2',
        dateTime: new Date('2024-12-30'),
        totalSlots: 50,
        availableSlots: 25,
        userId: userId,
        toJSON: () => ({
          id: '2',
          title: 'Event 2',
          description: 'Description 2',
          dateTime: new Date('2024-12-30'),
          totalSlots: 50,
          availableSlots: 25,
          userId: userId
        })
      }
    ];

    mockEventRepository.findByUserId.mockResolvedValue(mockEvents);

    const result = await listUserEventsUseCase.execute(userId);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].title).toBe('Event 1');
    expect(result.data[1].title).toBe('Event 2');
    expect(mockEventRepository.findByUserId).toHaveBeenCalledWith(userId);
  });

  test('should return empty array when user has no events', async () => {
    const userId = 'user123';
    mockEventRepository.findByUserId.mockResolvedValue([]);

    const result = await listUserEventsUseCase.execute(userId);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
    expect(mockEventRepository.findByUserId).toHaveBeenCalledWith(userId);
  });

  test('should return error when userId is not provided', async () => {
    const result = await listUserEventsUseCase.execute(null);

    expect(result.success).toBe(false);
    expect(result.error).toBe('User ID is required');
    expect(mockEventRepository.findByUserId).not.toHaveBeenCalled();
  });

  test('should return error when repository throws error', async () => {
    const userId = 'user123';
    mockEventRepository.findByUserId.mockRejectedValue(new Error('Database error'));

    const result = await listUserEventsUseCase.execute(userId);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
    expect(mockEventRepository.findByUserId).toHaveBeenCalledWith(userId);
  });
});
