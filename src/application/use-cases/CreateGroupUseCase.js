const Group = require('../../domain/entities/Group');

class CreateGroupUseCase {
  constructor(groupRepository) {
    this.groupRepository = groupRepository;
  }

  async execute(name, description = '', permissions = []) {
    // Check if group already exists
    const existingGroup = await this.groupRepository.findByName(name);
    if (existingGroup) {
      throw new Error('Group already exists');
    }

    // Create group entity
    const group = new Group(name, description, permissions);
    group.validate();

    // Save to database
    const createdGroup = await this.groupRepository.create(group);
    
    return {
      id: createdGroup.id,
      name: createdGroup.name,
      description: createdGroup.description,
      permissions: createdGroup.permissions,
      createdAt: createdGroup.createdAt
    };
  }
}

module.exports = CreateGroupUseCase;
