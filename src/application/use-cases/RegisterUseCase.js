const User = require('../../domain/entities/User');

class RegisterUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userData) {
    try {
      // Validate input data
      if (!userData.username || !userData.email || !userData.password) {
        return {
          success: false,
          error: 'Missing required fields: username, email, password'
        };
      }

      if (userData.password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters long'
        };
      }

      // Check if user already exists
      const existingUserByEmail = await this.userRepository.findByEmail(userData.email);
      if (existingUserByEmail) {
        return {
          success: false,
          error: 'Email already registered'
        };
      }

      const existingUserByUsername = await this.userRepository.findByUsername(userData.username);
      if (existingUserByUsername) {
        return {
          success: false,
          error: 'Username already taken'
        };
      }

      // Create new user (role is always 'user' for registration, superuser can only be set by other superuser)
      // isActive can be set during creation
      const user = new User({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: 'user',
        isActive: userData.isActive
      });

      const createdUser = await this.userRepository.create(user);

      return {
        success: true,
        data: createdUser.toJSON()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = RegisterUseCase;
