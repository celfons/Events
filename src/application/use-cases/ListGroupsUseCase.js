class ListGroupsUseCase {
  constructor(groupRepository) {
    this.groupRepository = groupRepository;
  }

  async execute(page = 1, limit = 10) {
    const result = await this.groupRepository.findAll(page, limit);
    return result;
  }
}

module.exports = ListGroupsUseCase;
