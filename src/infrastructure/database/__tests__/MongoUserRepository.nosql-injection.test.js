const MongoUserRepository = require('../MongoUserRepository');
const UserModel = require('../UserModel');

describe('MongoUserRepository - NoSQL Injection Protection', () => {
  let repository;

  beforeEach(() => {
    repository = new MongoUserRepository();
  });

  describe('findByEmail - NoSQL injection protection', () => {
    it('should safely handle object injection attempts with $ne operator', async () => {
      // Mock to track the query structure
      UserModel.findOne = jest.fn().mockResolvedValue(null);

      // Attempt to pass an object instead of a string (NoSQL injection)
      const maliciousInput = { $ne: null };
      await repository.findByEmail(maliciousInput);

      // Verify that the query uses $eq to treat input as literal value
      expect(UserModel.findOne).toHaveBeenCalledWith({
        email: { $eq: maliciousInput }
      });
    });

    it('should safely handle object injection attempts with $gt operator', async () => {
      UserModel.findOne = jest.fn().mockResolvedValue(null);

      const maliciousInput = { $gt: '' };
      await repository.findByEmail(maliciousInput);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        email: { $eq: maliciousInput }
      });
    });

    it('should work correctly with legitimate email strings', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hash',
        role: 'user',
        isActive: true,
        createdAt: new Date()
      };

      UserModel.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(UserModel.findOne).toHaveBeenCalledWith({
        email: { $eq: 'test@example.com' }
      });
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('findByUsername - NoSQL injection protection', () => {
    it('should safely handle object injection attempts', async () => {
      UserModel.findOne = jest.fn().mockResolvedValue(null);

      const maliciousInput = { $ne: null };
      await repository.findByUsername(maliciousInput);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        username: { $eq: maliciousInput }
      });
    });

    it('should work correctly with legitimate username strings', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hash',
        role: 'user',
        isActive: true,
        createdAt: new Date()
      };

      UserModel.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await repository.findByUsername('testuser');

      expect(UserModel.findOne).toHaveBeenCalledWith({
        username: { $eq: 'testuser' }
      });
      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
    });
  });

  describe('findModelByEmail - NoSQL injection protection', () => {
    it('should safely handle object injection attempts', async () => {
      UserModel.findOne = jest.fn().mockResolvedValue(null);

      const maliciousInput = { $ne: null };
      await repository.findModelByEmail(maliciousInput);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        email: { $eq: maliciousInput }
      });
    });

    it('should work correctly with legitimate email strings', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        password: 'hash',
        comparePassword: jest.fn()
      };

      UserModel.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await repository.findModelByEmail('test@example.com');

      expect(UserModel.findOne).toHaveBeenCalledWith({
        email: { $eq: 'test@example.com' }
      });
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });
  });
});
