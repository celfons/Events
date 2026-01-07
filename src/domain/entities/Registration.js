class Registration {
  constructor({ id, eventId, name, email, phone, registeredAt, status, verificationCode, verified, verifiedAt }) {
    this.id = id;
    this.eventId = eventId;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.registeredAt = registeredAt || new Date();
    this.status = status || 'pending'; // pending, active, cancelled
    this.verificationCode = verificationCode;
    this.verified = verified || false;
    this.verifiedAt = verifiedAt;
  }

  cancel() {
    if (this.status === 'cancelled') {
      throw new Error('Registration is already cancelled');
    }
    this.status = 'cancelled';
  }

  verify() {
    if (this.verified) {
      throw new Error('Registration is already verified');
    }
    this.verified = true;
    this.verifiedAt = new Date();
    this.status = 'active';
  }

  isActive() {
    return this.status === 'active';
  }

  isPending() {
    return this.status === 'pending';
  }

  toJSON() {
    return {
      id: this.id,
      eventId: this.eventId,
      name: this.name,
      email: this.email,
      phone: this.phone,
      registeredAt: this.registeredAt,
      status: this.status,
      verified: this.verified,
      verifiedAt: this.verifiedAt
    };
  }
}

module.exports = Registration;
