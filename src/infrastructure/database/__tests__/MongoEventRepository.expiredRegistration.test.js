const MongoEventRepository = require('../MongoEventRepository');
const EventModel = require('../EventModel');
const Registration = require('../../../domain/entities/Registration');

// Mock the EventModel
jest.mock('../EventModel');

describe('MongoEventRepository - Expired Registration Validation', () => {
  let repository;

  beforeEach(() => {
    repository = new MongoEventRepository();
    jest.clearAllMocks();
  });

  describe('findParticipantByEmail', () => {
    it('should not find participant with expired pending registration', async () => {
      const eventId = '507f1f77bcf86cd799439011';
      const email = 'john@example.com';

      EventModel.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findParticipantByEmail(eventId, email);

      expect(result).toBeNull();
      expect(EventModel.findOne).toHaveBeenCalledWith({
        _id: eventId,
        participants: {
          $elemMatch: {
            email: email.toLowerCase(),
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

    it('should find participant with non-expired pending registration', async () => {
      const eventId = '507f1f77bcf86cd799439011';
      const email = 'john@example.com';
      const futureDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes in future

      // Mock an event with a non-expired pending registration
      const mockEvent = {
        _id: eventId,
        participants: [
          {
            _id: '507f1f77bcf86cd799439012',
            email: 'john@example.com',
            name: 'John Doe',
            phone: '+1234567890',
            status: 'pending',
            verificationCodeExpiresAt: futureDate,
            registeredAt: new Date()
          }
        ]
      };

      EventModel.findOne = jest.fn().mockResolvedValue(mockEvent);

      const result = await repository.findParticipantByEmail(eventId, email);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Registration);
      expect(result.email).toBe('john@example.com');
      expect(result.status).toBe('pending');
    });

    it('should find participant with confirmed status', async () => {
      const eventId = '507f1f77bcf86cd799439011';
      const email = 'john@example.com';

      // Mock an event with a confirmed registration
      const mockEvent = {
        _id: eventId,
        participants: [
          {
            _id: '507f1f77bcf86cd799439012',
            email: 'john@example.com',
            name: 'John Doe',
            phone: '+1234567890',
            status: 'confirmed',
            registeredAt: new Date()
          }
        ]
      };

      EventModel.findOne = jest.fn().mockResolvedValue(mockEvent);

      const result = await repository.findParticipantByEmail(eventId, email);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Registration);
      expect(result.email).toBe('john@example.com');
      expect(result.status).toBe('confirmed');
    });
  });

  describe('findParticipantByPhone', () => {
    it('should not find participant with expired pending registration', async () => {
      const eventId = '507f1f77bcf86cd799439011';
      const phone = '+1234567890';

      EventModel.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findParticipantByPhone(eventId, phone);

      expect(result).toBeNull();
      expect(EventModel.findOne).toHaveBeenCalledWith({
        _id: eventId,
        participants: {
          $elemMatch: {
            phone: phone,
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

    it('should find participant with non-expired pending registration', async () => {
      const eventId = '507f1f77bcf86cd799439011';
      const phone = '+1234567890';
      const futureDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes in future

      // Mock an event with a non-expired pending registration
      const mockEvent = {
        _id: eventId,
        participants: [
          {
            _id: '507f1f77bcf86cd799439012',
            email: 'john@example.com',
            name: 'John Doe',
            phone: '+1234567890',
            status: 'pending',
            verificationCodeExpiresAt: futureDate,
            registeredAt: new Date()
          }
        ]
      };

      EventModel.findOne = jest.fn().mockResolvedValue(mockEvent);

      const result = await repository.findParticipantByPhone(eventId, phone);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Registration);
      expect(result.phone).toBe('+1234567890');
      expect(result.status).toBe('pending');
    });

    it('should find participant with confirmed status', async () => {
      const eventId = '507f1f77bcf86cd799439011';
      const phone = '+1234567890';

      // Mock an event with a confirmed registration
      const mockEvent = {
        _id: eventId,
        participants: [
          {
            _id: '507f1f77bcf86cd799439012',
            email: 'john@example.com',
            name: 'John Doe',
            phone: '+1234567890',
            status: 'confirmed',
            registeredAt: new Date()
          }
        ]
      };

      EventModel.findOne = jest.fn().mockResolvedValue(mockEvent);

      const result = await repository.findParticipantByPhone(eventId, phone);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Registration);
      expect(result.phone).toBe('+1234567890');
      expect(result.status).toBe('confirmed');
    });
  });
});
