class Event {
  constructor({
    id,
    title,
    description,
    dateTime,
    totalSlots,
    availableSlots,
    participants,
    createdAt,
    userId,
    local,
    isActive
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.dateTime = dateTime;
    this.totalSlots = totalSlots;
    this.availableSlots = availableSlots !== undefined ? availableSlots : totalSlots;
    this.participants = participants || [];
    this.createdAt = createdAt || new Date();
    this.userId = userId;
    this.local = local;
    this.isActive = isActive !== undefined ? isActive : true;
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
      // Already at capacity - this may indicate data inconsistency but we shouldn't fail the operation
      // Silently skip incrementing to avoid user-facing errors during cancellation
      return;
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
      participants: this.participants,
      createdAt: this.createdAt,
      userId: this.userId,
      local: this.local,
      isActive: this.isActive
    };
  }
}

module.exports = Event;
