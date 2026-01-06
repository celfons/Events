class DeleteGroupUseCase {
  constructor(groupRepository) {
    this.groupRepository = groupRepository;
  }

  async execute(id) {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new Error('Group not found');
    }

    const deleted = await this.groupRepository.delete(id);
    return deleted;
  }
}

module.exports = DeleteGroupUseCase;
