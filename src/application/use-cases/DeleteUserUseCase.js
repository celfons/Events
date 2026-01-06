class DeleteUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const deleted = await this.userRepository.delete(id);
    return deleted;
  }
}

module.exports = DeleteUserUseCase;
