class Group {
  constructor(name, description = '', permissions = []) {
    this.name = name;
    this.description = description;
    this.permissions = permissions; // Array of permission strings like 'events:create', 'events:delete'
    this.createdAt = new Date();
  }

  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Group name is required');
    }

    if (this.name.trim().length < 3) {
      throw new Error('Group name must be at least 3 characters');
    }
  }

  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  addPermission(permission) {
    if (!this.hasPermission(permission)) {
      this.permissions.push(permission);
    }
  }

  removePermission(permission) {
    this.permissions = this.permissions.filter(p => p !== permission);
  }
}

module.exports = Group;
