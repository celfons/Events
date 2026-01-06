const bcrypt = require('bcryptjs');

class LoginUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(username, password) {
    // Find user by username
    const user = await this.userRepository.findByUsername(username);
    
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // Return user data without password
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      groups: user.groups,
      isActive: user.isActive
    };
  }
}

module.exports = LoginUseCase;
