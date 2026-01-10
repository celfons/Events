const MongoEventRepository = require('../MongoEventRepository');
const EventModel = require('../EventModel');

describe('MongoEventRepository - NoSQL Injection Protection', () => {
  let repository;

  beforeEach(() => {
    repository = new MongoEventRepository();
  });

  describe('findByUserId - NoSQL injection protection', () => {
    it('should safely handle object injection attempts with $ne operator', async () => {
      // Mock to track the query structure
      const mockSort = jest.fn().mockResolvedValue([]);
      EventModel.find = jest.fn().mockReturnValue({
        sort: mockSort
      });

      // Attempt to pass an object instead of a string (NoSQL injection)
      const maliciousInput = { $ne: null };
      await repository.findByUserId(maliciousInput);

      // Verify that the query uses $eq to treat input as literal value
      expect(EventModel.find).toHaveBeenCalledWith({
        userId: { $eq: maliciousInput }
      });
    });

    it('should safely handle object injection attempts with $gt operator', async () => {
      const mockSort = jest.fn().mockResolvedValue([]);
      EventModel.find = jest.fn().mockReturnValue({
        sort: mockSort
      });

      const maliciousInput = { $gt: '' };
      await repository.findByUserId(maliciousInput);

      expect(EventModel.find).toHaveBeenCalledWith({
        userId: { $eq: maliciousInput }
      });
    });

    it('should work correctly with legitimate userId strings', async () => {
      const mockEvent = {
        _id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date(),
        totalSlots: 10,
        availableSlots: 5,
        participants: [],
        userId: 'user123',
        local: 'Test Location',
        isActive: true,
        eventCode: 'TEST123',
        createdAt: new Date()
      };

      const mockSort = jest.fn().mockResolvedValue([mockEvent]);
      EventModel.find = jest.fn().mockReturnValue({
        sort: mockSort
      });

      const result = await repository.findByUserId('user123');

      expect(EventModel.find).toHaveBeenCalledWith({
        userId: { $eq: 'user123' }
      });
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });
  });

  describe('findByEventCode - NoSQL injection protection', () => {
    it('should safely handle object injection attempts by failing early', async () => {
      EventModel.findOne = jest.fn().mockResolvedValue(null);

      const maliciousInput = { $ne: null };

      // Should throw error when trying to call toUpperCase on non-string
      await expect(repository.findByEventCode(maliciousInput)).rejects.toThrow();

      // Query should not be executed with malicious input
      expect(EventModel.findOne).not.toHaveBeenCalled();
    });

    it('should work correctly with legitimate eventCode strings', async () => {
      const mockEvent = {
        _id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date(),
        totalSlots: 10,
        availableSlots: 5,
        participants: [],
        userId: 'user123',
        local: 'Test Location',
        isActive: true,
        eventCode: 'TEST123',
        createdAt: new Date()
      };

      EventModel.findOne = jest.fn().mockResolvedValue(mockEvent);

      const result = await repository.findByEventCode('test123');

      expect(EventModel.findOne).toHaveBeenCalledWith({
        eventCode: { $eq: 'TEST123' }
      });
      expect(result).toBeDefined();
      expect(result.eventCode).toBe('TEST123');
    });

    it('should handle eventCode case conversion', async () => {
      EventModel.findOne = jest.fn().mockResolvedValue(null);

      await repository.findByEventCode('lowercase');

      expect(EventModel.findOne).toHaveBeenCalledWith({
        eventCode: { $eq: 'LOWERCASE' }
      });
    });
  });
});
