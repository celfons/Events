const RegisterUseCase = require('../RegisterUseCase');
const User = require('../../../domain/entities/User');

describe('RegisterUseCase', () => {
  let registerUseCase;
  let mockUserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn()
    };
    registerUseCase = new RegisterUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should return error when username is missing', async () => {
      const result = await registerUseCase.execute({
        email: 'user@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: username, email, password');
    });

    it('should return error when email is missing', async () => {
      const result = await registerUseCase.execute({
        username: 'testuser',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: username, email, password');
    });

    it('should return error when password is missing', async () => {
      const result = await registerUseCase.execute({
        username: 'testuser',
        email: 'user@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: username, email, password');
    });

    it('should return error when password is too short', async () => {
      const result = await registerUseCase.execute({
        username: 'testuser',
        email: 'user@example.com',
        password: '12345'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password must be at least 6 characters long');
    });

    it('should return error when email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        new User({
          id: '123',
          username: 'existinguser',
          email: 'user@example.com',
          password: 'hashed',
          role: 'user'
        })
      );

      const result = await registerUseCase.execute({
        username: 'testuser',
        email: 'user@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
    });

    it('should return error when username already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(
        new User({
          id: '123',
          username: 'testuser',
          email: 'other@example.com',
          password: 'hashed',
          role: 'user'
        })
      );

      const result = await registerUseCase.execute({
        username: 'testuser',
        email: 'user@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Username already taken');
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should create user successfully with role "user"', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);

      const createdUser = new User({
        id: '123',
        username: 'testuser',
        email: 'user@example.com',
        password: 'hashed',
        role: 'user'
      });
      mockUserRepository.create.mockResolvedValue(createdUser);

      const result = await registerUseCase.execute({
        username: 'testuser',
        email: 'user@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdUser.toJSON());
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'testuser',
          email: 'user@example.com',
          password: 'password123',
          role: 'user'
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      const result = await registerUseCase.execute({
        username: 'testuser',
        email: 'user@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
