class Event {
  constructor({ id, title, description, dateTime, totalSlots, availableSlots, createdAt }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.dateTime = dateTime;
    this.totalSlots = totalSlots;
    this.availableSlots = availableSlots || totalSlots;
    this.createdAt = createdAt || new Date();
  }

  hasAvailableSlots() {
    return this.availableSlots > 0;
  }

  decrementSlots() {
    if (!this.hasAvailableSlots()) {
      throw new Error('No available slots for this event');
    }
    this.availableSlots -= 1;
  }

  incrementSlots() {
    if (this.availableSlots >= this.totalSlots) {
      throw new Error('Cannot increment slots beyond total slots');
    }
    this.availableSlots += 1;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      dateTime: this.dateTime,
      totalSlots: this.totalSlots,
      availableSlots: this.availableSlots,
      createdAt: this.createdAt
    };
  }
}

module.exports = Event;
