/**
 * Event Request DTOs
 */

/**
 * CreateEventRequest DTO
 */
class CreateEventRequest {
  constructor({ title, description, dateTime, totalSlots, local }) {
    this.title = title;
    this.description = description;
    this.dateTime = dateTime;
    this.totalSlots = totalSlots;
    this.local = local;
  }

  static fromBody(body) {
    return new CreateEventRequest(body);
  }
}

/**
 * UpdateEventRequest DTO
 */
class UpdateEventRequest {
  constructor({ title, description, dateTime, totalSlots, local }) {
    if (title !== undefined) this.title = title;
    if (description !== undefined) this.description = description;
    if (dateTime !== undefined) this.dateTime = dateTime;
    if (totalSlots !== undefined) this.totalSlots = totalSlots;
    if (local !== undefined) this.local = local;
  }

  static fromBody(body) {
    return new UpdateEventRequest(body);
  }
}

module.exports = {
  CreateEventRequest,
  UpdateEventRequest
};
