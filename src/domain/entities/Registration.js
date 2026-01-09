class Registration {
  constructor({ id, eventId, name, email, phone, registeredAt, status }) {
    this.id = id;
    this.eventId = eventId;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.registeredAt = registeredAt || new Date();
    this.status = status || 'pending'; // pending, confirmed, cancelled
  }

  cancel() {
    if (this.status === 'cancelled') {
      throw new Error('Registration is already cancelled');
    }
    this.status = 'cancelled';
  }

  isActive() {
    return this.status === 'confirmed' || this.status === 'pending';
  }

  isConfirmed() {
    return this.status === 'confirmed';
  }

  toJSON() {
    return {
      id: this.id,
      eventId: this.eventId,
      name: this.name,
      email: this.email,
      phone: this.phone,
      registeredAt: this.registeredAt,
      status: this.status
    };
  }
}

module.exports = Registration;
