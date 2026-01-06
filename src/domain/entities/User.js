class User {
  constructor(username, email, password, groups = [], isActive = true) {
    this.username = username;
    this.email = email;
    this.password = password; // Should be hashed
    this.groups = groups; // Array of group IDs
    this.isActive = isActive;
    this.createdAt = new Date();
  }

  validate() {
    if (!this.username || this.username.trim().length === 0) {
      throw new Error('Username is required');
    }

    if (!this.email || this.email.trim().length === 0) {
      throw new Error('Email is required');
    }

    if (!this.isValidEmail(this.email)) {
      throw new Error('Invalid email format');
    }

    if (!this.password || this.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  hasGroup(groupId) {
    return this.groups.some(g => g.toString() === groupId.toString());
  }

  addGroup(groupId) {
    if (!this.hasGroup(groupId)) {
      this.groups.push(groupId);
    }
  }

  removeGroup(groupId) {
    this.groups = this.groups.filter(g => g.toString() !== groupId.toString());
  }

  /**
   * Check if user has a specific permission through any of their groups
   * @param {string} permission - Permission to check (e.g., 'events:create')
   * @param {Array} populatedGroups - Array of populated group objects
   * @returns {boolean}
   */
  hasPermission(permission, populatedGroups) {
    if (!populatedGroups || populatedGroups.length === 0) {
      return false;
    }
    return populatedGroups.some(group => 
      group.permissions && group.permissions.includes(permission)
    );
  }
}

module.exports = User;
