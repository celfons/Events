class UpdateGroupUseCase {
  constructor(groupRepository) {
    this.groupRepository = groupRepository;
  }

  async execute(id, groupData) {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new Error('Group not found');
    }

    // Check if name is being changed and if it's already taken
    if (groupData.name && groupData.name !== group.name) {
      const existingGroup = await this.groupRepository.findByName(groupData.name);
      if (existingGroup) {
        throw new Error('Group name already exists');
      }
    }

    const updateData = {
      name: groupData.name || group.name,
      description: groupData.description !== undefined ? groupData.description : group.description,
      permissions: groupData.permissions || group.permissions
    };

    const updatedGroup = await this.groupRepository.update(id, updateData);
    
    return {
      id: updatedGroup.id,
      name: updatedGroup.name,
      description: updatedGroup.description,
      permissions: updatedGroup.permissions,
      createdAt: updatedGroup.createdAt
    };
  }
}

module.exports = UpdateGroupUseCase;
