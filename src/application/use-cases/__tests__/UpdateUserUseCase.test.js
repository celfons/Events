const UpdateUserUseCase = require('../UpdateUserUseCase');
const User = require('../../../domain/entities/User');

describe('UpdateUserUseCase', () => {
  let updateUserUseCase;
  let mockUserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      update: jest.fn()
    };
    updateUserUseCase = new UpdateUserUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should return error when userId is missing', async () => {
      const result = await updateUserUseCase.execute(null, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should return error when user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await updateUserUseCase.execute('123', { username: 'newname' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(mockUserRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should update user without password', async () => {
      const existingUser = new User({
        id: '123',
        username: 'oldusername',
        email: 'old@example.com',
        password: 'hashed',
        role: 'user'
      });

      const updatedUser = new User({
        id: '123',
        username: 'newusername',
        email: 'new@example.com',
        password: 'hashed',
        role: 'superuser'
      });

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await updateUserUseCase.execute('123', {
        username: 'newusername',
        email: 'new@example.com',
        role: 'superuser'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedUser.toJSON());
      expect(mockUserRepository.update).toHaveBeenCalledWith('123', {
        username: 'newusername',
        email: 'new@example.com',
        role: 'superuser'
      });
    });

    it('should update user with password', async () => {
      const existingUser = new User({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'oldhashed',
        role: 'user'
      });

      const updatedUser = new User({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'newhashed',
        role: 'user'
      });

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await updateUserUseCase.execute('123', {
        password: 'newpassword123'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedUser.toJSON());
      expect(mockUserRepository.update).toHaveBeenCalledWith('123', {
        password: 'newpassword123'
      });
    });

    it('should return error when password is too short', async () => {
      const existingUser = new User({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        role: 'user'
      });

      mockUserRepository.findById.mockResolvedValue(existingUser);

      const result = await updateUserUseCase.execute('123', {
        password: '12345'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password must be at least 6 characters long');
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const existingUser = new User({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        role: 'user'
      });

      const updatedUser = new User({
        id: '123',
        username: 'testuser',
        email: 'newemail@example.com',
        password: 'hashed',
        role: 'user'
      });

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await updateUserUseCase.execute('123', {
        email: 'newemail@example.com'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedUser.toJSON());
      expect(mockUserRepository.update).toHaveBeenCalledWith('123', {
        email: 'newemail@example.com'
      });
    });

    it('should return error when update fails', async () => {
      const existingUser = new User({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        role: 'user'
      });

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue(null);

      const result = await updateUserUseCase.execute('123', {
        username: 'newname'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update user');
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await updateUserUseCase.execute('123', {
        username: 'newname'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should update user isActive status', async () => {
      const existingUser = new User({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        role: 'user',
        isActive: true
      });

      const updatedUser = new User({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        role: 'user',
        isActive: false
      });

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await updateUserUseCase.execute('123', {
        isActive: false
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedUser.toJSON());
      expect(mockUserRepository.update).toHaveBeenCalledWith('123', {
        isActive: false
      });
    });
  });
});
