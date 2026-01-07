class User {
  constructor({ id, username, email, password, role, isActive, createdAt }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.role = role || 'user'; // 'user' or 'superuser'
    this.isActive = isActive !== undefined ? isActive : true; // default to true
    this.createdAt = createdAt || new Date();
  }

  isSuperuser() {
    return this.role === 'superuser';
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt
    };
  }
}

module.exports = User;
