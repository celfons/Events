class RegistrationController {
  constructor(registerForEventUseCase, cancelRegistrationUseCase) {
    this.registerForEventUseCase = registerForEventUseCase;
    this.cancelRegistrationUseCase = cancelRegistrationUseCase;
  }

  async register(req, res, next) {
    try {
      const result = await this.registerForEventUseCase.execute(req.body);

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

  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const { eventId } = req.body;

      if (!eventId) {
        const error = new Error('eventId is required in request body');
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        throw error;
      }

      const result = await this.cancelRegistrationUseCase.execute(eventId, id);

      if (!result.success) {
        const error = new Error(result.error);
        error.statusCode = 400;
        error.code = 'BAD_REQUEST';
        throw error;
      }

      return res.status(200).json({ message: result.message });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RegistrationController;
