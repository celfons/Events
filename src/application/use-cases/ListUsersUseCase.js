class ListUsersUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute() {
    try {
      const users = await this.userRepository.findAll();

      return {
        success: true,
        data: users.map(user => user.toJSON())
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ListUsersUseCase;
