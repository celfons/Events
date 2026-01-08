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

  async listEvents(req, res, next) {
    try {
      const result = await this.listEventsUseCase.execute();

      if (!result.success) {
        const error = new Error(result.error);
        error.statusCode = 400;
        error.code = 'BAD_REQUEST';
        throw error;
      }

      return res.status(200).json(result.data);
    } catch (error) {
      next(error);
    }
  }

  async getEventDetails(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.getEventDetailsUseCase.execute(id);

      if (!result.success) {
        const error = new Error(result.error);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      return res.status(200).json(result.data);
    } catch (error) {
      next(error);
    }
  }

  async createEvent(req, res, next) {
    try {
      const userId = req.user ? req.user.userId : null;
      const result = await this.createEventUseCase.execute(req.body, userId);

      if (!result.success) {
        const error = new Error(result.error);
        error.statusCode = 400;
        error.code = 'BAD_REQUEST';
        throw error;
      }

      return res.status(201).json(result.data);
    } catch (error) {
      next(error);
    }
  }

  async updateEvent(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.userId : null;
      const result = await this.updateEventUseCase.execute(id, req.body, userId);

      if (!result.success) {
        const error = new Error(result.error);
        error.statusCode = 400;
        error.code = 'BAD_REQUEST';
        throw error;
      }

      return res.status(200).json(result.data);
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.userId : null;
      const result = await this.deleteEventUseCase.execute(id, userId);

      if (!result.success) {
        const error = new Error(result.error);
        error.statusCode = 400;
        error.code = 'BAD_REQUEST';
        throw error;
      }

      return res.status(200).json(result.data);
    } catch (error) {
      next(error);
    }
  }

  async getEventParticipants(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.getEventParticipantsUseCase.execute(id);

      if (!result.success) {
        const error = new Error(result.error);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      return res.status(200).json(result.data);
    } catch (error) {
      next(error);
    }
  }

  async listUserEvents(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await this.listUserEventsUseCase.execute(userId);

      if (!result.success) {
        const error = new Error(result.error);
        error.statusCode = 400;
        error.code = 'BAD_REQUEST';
        throw error;
      }

      return res.status(200).json(result.data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = EventController;
