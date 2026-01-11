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

  describe('findParticipantByEmail - NoSQL injection protection', () => {
    const mockEventId = 'event123';

    it('should safely handle object injection attempts with $ne operator', async () => {
      EventModel.findOne = jest.fn().mockResolvedValue(null);

      const maliciousInput = { $ne: null };

      // Should throw error when trying to call toLowerCase on non-string
      await expect(repository.findParticipantByEmail(mockEventId, maliciousInput)).rejects.toThrow();

      // Query should not be executed with malicious input
      expect(EventModel.findOne).not.toHaveBeenCalled();
    });

    it('should safely handle object injection attempts with $gt operator', async () => {
      EventModel.findOne = jest.fn().mockResolvedValue(null);

      const maliciousInput = { $gt: '' };

      // Should throw error when trying to call toLowerCase on non-string
      await expect(repository.findParticipantByEmail(mockEventId, maliciousInput)).rejects.toThrow();

      expect(EventModel.findOne).not.toHaveBeenCalled();
    });

    it('should work correctly with legitimate email strings', async () => {
      const now = new Date();
      const mockEvent = {
        _id: mockEventId,
        title: 'Test Event',
        participants: [
          {
            _id: 'participant123',
            name: 'Test User',
            email: 'test@example.com',
            phone: '1234567890',
            status: 'confirmed',
            registeredAt: now
          }
        ]
      };

      EventModel.findOne = jest.fn().mockResolvedValue(mockEvent);

      const result = await repository.findParticipantByEmail(mockEventId, 'test@example.com');

      // Verify that the query uses $eq to treat email as literal value
      expect(EventModel.findOne).toHaveBeenCalledWith({
        _id: mockEventId,
        participants: {
          $elemMatch: {
            email: { $eq: 'test@example.com' },
            $or: [
              { status: 'confirmed' },
              {
                status: 'pending',
                verificationCodeExpiresAt: { $gt: expect.any(Date) }
              }
            ]
          }
        }
      });
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should normalize email to lowercase', async () => {
      EventModel.findOne = jest.fn().mockResolvedValue(null);

      await repository.findParticipantByEmail(mockEventId, 'Test@EXAMPLE.com');

      // Verify email was normalized to lowercase in the query
      expect(EventModel.findOne).toHaveBeenCalledWith({
        _id: mockEventId,
        participants: {
          $elemMatch: {
            email: { $eq: 'test@example.com' },
            $or: [
              { status: 'confirmed' },
              {
                status: 'pending',
                verificationCodeExpiresAt: { $gt: expect.any(Date) }
              }
            ]
          }
        }
      });
    });
  });

  describe('findParticipantByPhone - NoSQL injection protection', () => {
    const mockEventId = 'event123';

    it('should safely handle object injection attempts with $ne operator', async () => {
      EventModel.findOne = jest.fn().mockResolvedValue(null);

      const maliciousInput = { $ne: null };
      const result = await repository.findParticipantByPhone(mockEventId, maliciousInput);

      // Verify that the query uses $eq to treat phone as literal value
      expect(EventModel.findOne).toHaveBeenCalledWith({
        _id: mockEventId,
        participants: {
          $elemMatch: {
            phone: { $eq: maliciousInput },
            $or: [
              { status: 'confirmed' },
              {
                status: 'pending',
                verificationCodeExpiresAt: { $gt: expect.any(Date) }
              }
            ]
          }
        }
      });
      expect(result).toBeNull();
    });

    it('should safely handle object injection attempts with $gt operator', async () => {
      EventModel.findOne = jest.fn().mockResolvedValue(null);

      const maliciousInput = { $gt: '' };
      const result = await repository.findParticipantByPhone(mockEventId, maliciousInput);

      // Verify that the query uses $eq to treat phone as literal value
      expect(EventModel.findOne).toHaveBeenCalledWith({
        _id: mockEventId,
        participants: {
          $elemMatch: {
            phone: { $eq: maliciousInput },
            $or: [
              { status: 'confirmed' },
              {
                status: 'pending',
                verificationCodeExpiresAt: { $gt: expect.any(Date) }
              }
            ]
          }
        }
      });
      expect(result).toBeNull();
    });

    it('should work correctly with legitimate phone strings', async () => {
      const now = new Date();
      const mockEvent = {
        _id: mockEventId,
        title: 'Test Event',
        participants: [
          {
            _id: 'participant123',
            name: 'Test User',
            email: 'test@example.com',
            phone: '1234567890',
            status: 'confirmed',
            registeredAt: now
          }
        ]
      };

      EventModel.findOne = jest.fn().mockResolvedValue(mockEvent);

      const result = await repository.findParticipantByPhone(mockEventId, '1234567890');

      // Verify that the query uses $eq to treat phone as literal value
      expect(EventModel.findOne).toHaveBeenCalledWith({
        _id: mockEventId,
        participants: {
          $elemMatch: {
            phone: { $eq: '1234567890' },
            $or: [
              { status: 'confirmed' },
              {
                status: 'pending',
                verificationCodeExpiresAt: { $gt: expect.any(Date) }
              }
            ]
          }
        }
      });
      expect(result).toBeDefined();
      expect(result.phone).toBe('1234567890');
    });
  });
});
