/**
 * Registration Response DTOs
 */

/**
 * RegistrationResponse DTO
 */
class RegistrationResponse {
  constructor(registration) {
    this.id = registration.id;
    this.eventId = registration.eventId;
    this.name = registration.name;
    this.email = registration.email;
    this.phone = registration.phone;
    this.status = registration.status;
    this.registeredAt = registration.registeredAt;
  }

  static fromEntity(registration) {
    return new RegistrationResponse(registration);
  }

  static fromEntities(registrations) {
    return registrations.map(reg => new RegistrationResponse(reg));
  }
}

module.exports = {
  RegistrationResponse
};
