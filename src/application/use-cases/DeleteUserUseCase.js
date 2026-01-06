class DeleteUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId) {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const deleted = await this.userRepository.delete(userId);

      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete user'
        };
      }

      return {
        success: true,
        data: { message: 'User deleted successfully' }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DeleteUserUseCase;
