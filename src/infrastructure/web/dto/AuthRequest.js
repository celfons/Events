/**
 * Authentication Request DTOs
 */

/**
 * LoginRequest DTO
 */
class LoginRequest {
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
  }

  static fromBody(body) {
    return new LoginRequest(body);
  }
}

/**
 * RegisterRequest DTO
 */
class RegisterRequest {
  constructor({ username, email, password, role }) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.role = role;
  }

  static fromBody(body) {
    return new RegisterRequest(body);
  }
}

module.exports = {
  LoginRequest,
  RegisterRequest
};
