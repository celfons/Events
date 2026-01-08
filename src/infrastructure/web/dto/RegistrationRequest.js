/**
 * Registration Request DTOs
 */

/**
 * CreateRegistrationRequest DTO
 */
class CreateRegistrationRequest {
  constructor({ eventId, name, email, phone }) {
    this.eventId = eventId;
    this.name = name;
    this.email = email;
    this.phone = phone;
  }

  static fromBody(body) {
    return new CreateRegistrationRequest(body);
  }
}

/**
 * CancelRegistrationRequest DTO
 */
class CancelRegistrationRequest {
  constructor({ eventId }) {
    this.eventId = eventId;
  }

  static fromBody(body) {
    return new CancelRegistrationRequest(body);
  }
}

module.exports = {
  CreateRegistrationRequest,
  CancelRegistrationRequest
};
