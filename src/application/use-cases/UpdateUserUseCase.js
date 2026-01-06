const bcrypt = require('bcryptjs');

class UpdateUserUseCase {
  constructor(userRepository, groupRepository) {
    this.userRepository = userRepository;
    this.groupRepository = groupRepository;
  }

  async execute(id, userData) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if username is being changed and if it's already taken
    if (userData.username && userData.username !== user.username) {
      const existingUsername = await this.userRepository.findByUsername(userData.username);
      if (existingUsername) {
        throw new Error('Username already exists');
      }
    }

    // Check if email is being changed and if it's already taken
    if (userData.email && userData.email !== user.email) {
      const existingEmail = await this.userRepository.findByEmail(userData.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Resolve group IDs from names if provided
    let groupIds = user.groups;
    if (userData.groups) {
      groupIds = [];
      for (const groupName of userData.groups) {
        const group = await this.groupRepository.findByName(groupName);
        if (group) {
          groupIds.push(group.id);
        }
      }
    }

    // Hash password if provided
    let hashedPassword = user.password;
    if (userData.password) {
      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      hashedPassword = await bcrypt.hash(userData.password, 10);
    }

    const updateData = {
      username: userData.username || user.username,
      email: userData.email || user.email,
      password: hashedPassword,
      groups: groupIds,
      isActive: userData.isActive !== undefined ? userData.isActive : user.isActive
    };

    const updatedUser = await this.userRepository.update(id, updateData);
    
    // Return without password
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      groups: updatedUser.groups,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt
    };
  }
}

module.exports = UpdateUserUseCase;
