const { ErrorResponse, SuccessResponse, EventResponse, EventDetailsResponse } = require('../dto');

class EventController {
  constructor(
    listEventsUseCase,
    getEventDetailsUseCase,
    createEventUseCase,
    updateEventUseCase,
    deleteEventUseCase,
    getEventParticipantsUseCase,
    listUserEventsUseCase
  ) {
    this.listEventsUseCase = listEventsUseCase;
    this.getEventDetailsUseCase = getEventDetailsUseCase;
    this.createEventUseCase = createEventUseCase;
    this.updateEventUseCase = updateEventUseCase;
    this.deleteEventUseCase = deleteEventUseCase;
    this.getEventParticipantsUseCase = getEventParticipantsUseCase;
    this.listUserEventsUseCase = listUserEventsUseCase;
  }

  async listEvents(req, res) {
    const result = await this.listEventsUseCase.execute();

    if (!result.success) {
      const errorResponse = ErrorResponse.invalidInput(result.error);
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }

    const events = EventResponse.fromEntities(result.data);
    const successResponse = SuccessResponse.list(events);
    return res.status(200).json(successResponse.toJSON());
  }

  async getEventDetails(req, res) {
    const { id } = req.params;
    const result = await this.getEventDetailsUseCase.execute(id);

    if (!result.success) {
      const errorResponse = ErrorResponse.notFound(result.error);
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }

    // result.data contains { event, registrationsCount }
    const eventData = { ...result.data.event, participants: [], participantsCount: result.data.registrationsCount };
    const event = EventDetailsResponse.fromEntity(eventData);
    const successResponse = SuccessResponse.ok(event);
    return res.status(200).json(successResponse.toJSON());
  }

  async createEvent(req, res) {
    const userId = req.user ? req.user.userId : null;
    const result = await this.createEventUseCase.execute(req.body, userId);

    if (!result.success) {
      const errorResponse = ErrorResponse.invalidInput(result.error);
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }

    const event = EventResponse.fromEntity(result.data);
    const successResponse = SuccessResponse.created(event);
    return res.status(201).json(successResponse.toJSON());
  }

  async updateEvent(req, res) {
    const { id } = req.params;
    const userId = req.user ? req.user.userId : null;
    const result = await this.updateEventUseCase.execute(id, req.body, userId);

    if (!result.success) {
      const errorResponse = ErrorResponse.invalidInput(result.error);
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }

    const event = EventResponse.fromEntity(result.data);
    const successResponse = SuccessResponse.updated(event);
    return res.status(200).json(successResponse.toJSON());
  }

  async deleteEvent(req, res) {
    const { id } = req.params;
    const userId = req.user ? req.user.userId : null;
    const result = await this.deleteEventUseCase.execute(id, userId);

    if (!result.success) {
      const errorResponse = ErrorResponse.invalidInput(result.error);
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }

    const successResponse = SuccessResponse.deleted('Event deleted successfully');
    return res.status(200).json(successResponse.toJSON());
  }

  async getEventParticipants(req, res) {
    const { id } = req.params;
    const result = await this.getEventParticipantsUseCase.execute(id);

    if (!result.success) {
      const errorResponse = ErrorResponse.notFound(result.error);
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }

    const successResponse = SuccessResponse.list(result.data);
    return res.status(200).json(successResponse.toJSON());
  }

  async listUserEvents(req, res) {
    const userId = req.user.userId;
    const result = await this.listUserEventsUseCase.execute(userId);

    if (!result.success) {
      const errorResponse = ErrorResponse.invalidInput(result.error);
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }

    const events = EventResponse.fromEntities(result.data);
    const successResponse = SuccessResponse.list(events);
    return res.status(200).json(successResponse.toJSON());
  }
}

module.exports = EventController;
