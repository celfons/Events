const User = require('../User');

describe('User', () => {
  describe('constructor', () => {
    it('should create a user with all properties', () => {
      const userData = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'user',
        createdAt: new Date('2024-01-01')
      };

      const user = new User(userData);

      expect(user.id).toBe('123');
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.password).toBe('hashed_password');
      expect(user.role).toBe('user');
      expect(user.createdAt).toEqual(new Date('2024-01-01'));
    });

    it('should default role to "user" if not provided', () => {
      const user = new User({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password'
      });

      expect(user.role).toBe('user');
    });

    it('should set createdAt to current date if not provided', () => {
      const beforeCreation = new Date();
      const user = new User({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password'
      });
      const afterCreation = new Date();

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('isSuperuser', () => {
    it('should return true when role is "superuser"', () => {
      const user = new User({
        id: '123',
        username: 'admin',
        email: 'admin@example.com',
        password: 'hashed',
        role: 'superuser'
      });

      expect(user.isSuperuser()).toBe(true);
    });

    it('should return false when role is "user"', () => {
      const user = new User({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        role: 'user'
      });

      expect(user.isSuperuser()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return user data without password', () => {
      const user = new User({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'user',
        createdAt: new Date('2024-01-01')
      });

      const json = user.toJSON();

      expect(json).toEqual({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date('2024-01-01')
      });
      expect(json.password).toBeUndefined();
    });
  });
});
