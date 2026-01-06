const jwt = require('jsonwebtoken');

class LoginUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(email, password) {
    try {
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      // Find user model to use comparePassword method
      const userModel = await this.userRepository.findModelByEmail(email);
      
      if (!userModel) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Compare password
      const isValidPassword = await userModel.comparePassword(password);
      
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check for JWT_SECRET
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is not set');
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: userModel._id.toString(), 
          email: userModel.email,
          role: userModel.role
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        data: {
          token,
          user: {
            id: userModel._id.toString(),
            username: userModel.username,
            email: userModel.email,
            role: userModel.role
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = LoginUseCase;
