/**
 * Event Response DTOs
 */

/**
 * EventResponse DTO
 * Represents a single event in responses
 */
class EventResponse {
  constructor(event) {
    this.id = event.id;
    this.title = event.title;
    this.description = event.description;
    this.dateTime = event.dateTime;
    this.totalSlots = event.totalSlots;
    this.availableSlots = event.availableSlots;
    this.local = event.local;
    this.userId = event.userId;
    this.isActive = event.isActive;
    this.createdAt = event.createdAt;
  }

  static fromEntity(event) {
    return new EventResponse(event);
  }

  static fromEntities(events) {
    return events.map(event => new EventResponse(event));
  }
}

/**
 * EventDetailsResponse DTO
 * Represents detailed event information including participants count
 */
class EventDetailsResponse extends EventResponse {
  constructor(event) {
    super(event);
    // Use explicitly passed participantsCount if available, otherwise calculate from participants array
    this.participantsCount =
      event.participantsCount !== undefined
        ? event.participantsCount
        : event.participants
          ? event.participants.length
          : 0;
  }

  static fromEntity(event) {
    return new EventDetailsResponse(event);
  }
}

module.exports = {
  EventResponse,
  EventDetailsResponse
};
