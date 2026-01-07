const LoginUseCase = require('../LoginUseCase');

describe('LoginUseCase', () => {
  let loginUseCase;
  let mockUserRepository;
  const originalEnv = process.env.JWT_SECRET;

  beforeEach(() => {
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret-key';
    
    mockUserRepository = {
      findModelByEmail: jest.fn()
    };
    loginUseCase = new LoginUseCase(mockUserRepository);
  });

  afterEach(() => {
    // Restore original JWT_SECRET
    process.env.JWT_SECRET = originalEnv;
  });

  describe('execute', () => {
    it('should return error when email is missing', async () => {
      const result = await loginUseCase.execute('', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email and password are required');
    });

    it('should return error when password is missing', async () => {
      const result = await loginUseCase.execute('user@example.com', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email and password are required');
    });

    it('should return error when user is not found', async () => {
      mockUserRepository.findModelByEmail.mockResolvedValue(null);

      const result = await loginUseCase.execute('user@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(mockUserRepository.findModelByEmail).toHaveBeenCalledWith('user@example.com');
    });

    it('should return error when password is invalid', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'user@example.com',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      mockUserRepository.findModelByEmail.mockResolvedValue(mockUser);

      const result = await loginUseCase.execute('user@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
    });

    it('should return token and user data when credentials are valid', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'user@example.com',
        role: 'user',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      mockUserRepository.findModelByEmail.mockResolvedValue(mockUser);

      const result = await loginUseCase.execute('user@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data.token).toBeDefined();
      expect(result.data.user).toEqual({
        id: '123',
        username: 'testuser',
        email: 'user@example.com',
        role: 'user'
      });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.findModelByEmail.mockRejectedValue(new Error('Database error'));

      const result = await loginUseCase.execute('user@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should return error when JWT_SECRET is not set', async () => {
      // Temporarily unset JWT_SECRET
      delete process.env.JWT_SECRET;

      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'user@example.com',
        role: 'user',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      mockUserRepository.findModelByEmail.mockResolvedValue(mockUser);

      const result = await loginUseCase.execute('user@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('JWT_SECRET environment variable is not set');

      // Restore JWT_SECRET
      process.env.JWT_SECRET = 'test-secret-key';
    });

    it('should return error when user is inactive', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'user@example.com',
        role: 'user',
        isActive: false,
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      mockUserRepository.findModelByEmail.mockResolvedValue(mockUser);

      const result = await loginUseCase.execute('user@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User account is inactive');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
    });
  });
});
