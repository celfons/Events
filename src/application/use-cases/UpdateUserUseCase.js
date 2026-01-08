class UpdateUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, userData) {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Build update object with only allowed fields
      const updateData = {};
      if (userData.username) {
        updateData.username = userData.username;
      }
      if (userData.email) {
        updateData.email = userData.email;
      }
      if (userData.role) {
        updateData.role = userData.role;
      }
      if (userData.isActive !== undefined) {
        updateData.isActive = userData.isActive;
      }
      if (userData.password) {
        // Validate password length
        if (userData.password.length < 6) {
          return {
            success: false,
            error: 'Password must be at least 6 characters long',
          };
        }
        updateData.password = userData.password;
      }

      const updatedUser = await this.userRepository.update(userId, updateData);

      if (!updatedUser) {
        return {
          success: false,
          error: 'Failed to update user',
        };
      }

      return {
        success: true,
        data: updatedUser.toJSON(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = UpdateUserUseCase;
