class ListUsersUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(page = 1, limit = 10) {
    const result = await this.userRepository.findAll(page, limit);
    
    // Remove passwords from response
    result.users = result.users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      groups: user.groups,
      isActive: user.isActive,
      createdAt: user.createdAt
    }));
    
    return result;
  }
}

module.exports = ListUsersUseCase;
