const bcrypt = require('bcryptjs');
const User = require('../../domain/entities/User');

class RegisterUserUseCase {
  constructor(userRepository, groupRepository) {
    this.userRepository = userRepository;
    this.groupRepository = groupRepository;
  }

  async execute(username, email, password, groupNames = []) {
    // Check if username already exists
    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await this.userRepository.findByEmail(email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Resolve group IDs from names
    const groupIds = [];
    for (const groupName of groupNames) {
      const group = await this.groupRepository.findByName(groupName);
      if (group) {
        groupIds.push(group.id);
      }
    }

    // Create user entity
    const user = new User(username, email, hashedPassword, groupIds);
    user.validate();

    // Save to database
    const createdUser = await this.userRepository.create(user);
    
    // Return user without password
    return {
      id: createdUser.id,
      username: createdUser.username,
      email: createdUser.email,
      groups: createdUser.groups,
      isActive: createdUser.isActive,
      createdAt: createdUser.createdAt
    };
  }
}

module.exports = RegisterUserUseCase;
