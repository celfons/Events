/**
 * Authentication Response DTOs
 */

/**
 * LoginResponse DTO
 */
class LoginResponse {
  constructor({ token, user }) {
    this.token = token;
    this.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
  }

  static fromData(data) {
    return new LoginResponse(data);
  }
}

/**
 * UserResponse DTO
 * Represents user information (without sensitive data)
 */
class UserResponse {
  constructor(user) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.role = user.role;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
  }

  static fromEntity(user) {
    return new UserResponse(user);
  }

  static fromEntities(users) {
    return users.map(user => new UserResponse(user));
  }
}

module.exports = {
  LoginResponse,
  UserResponse
};
