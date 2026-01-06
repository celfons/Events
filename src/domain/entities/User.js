class User {
  constructor({ id, username, email, password, role, createdAt }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.role = role || 'user'; // 'user' or 'superuser'
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
      createdAt: this.createdAt
    };
  }
}

module.exports = User;
