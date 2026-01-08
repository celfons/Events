const { ErrorResponse, SuccessResponse, RegistrationResponse } = require('../dto');

class RegistrationController {
  constructor(registerForEventUseCase, cancelRegistrationUseCase) {
    this.registerForEventUseCase = registerForEventUseCase;
    this.cancelRegistrationUseCase = cancelRegistrationUseCase;
  }

  async register(req, res) {
    try {
      const result = await this.registerForEventUseCase.execute(req.body);

      if (!result.success) {
        const errorResponse = ErrorResponse.invalidInput(result.error);
        return res.status(errorResponse.status).json(errorResponse.toJSON());
      }

      const registration = RegistrationResponse.fromEntity(result.data);
      const successResponse = SuccessResponse.created(registration, 'Registration created successfully');
      return res.status(201).json(successResponse.toJSON());
    } catch (error) {
      const errorResponse = ErrorResponse.internalError();
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }
  }

  async cancel(req, res) {
    try {
      const { id } = req.params;
      const { eventId } = req.body;

      if (!eventId) {
        const errorResponse = ErrorResponse.invalidInput('eventId is required in request body');
        return res.status(errorResponse.status).json(errorResponse.toJSON());
      }

      const result = await this.cancelRegistrationUseCase.execute(eventId, id);

      if (!result.success) {
        const errorResponse = ErrorResponse.invalidInput(result.error);
        return res.status(errorResponse.status).json(errorResponse.toJSON());
      }

      const successResponse = SuccessResponse.ok(null, result.message);
      return res.status(200).json(successResponse.toJSON());
    } catch (error) {
      const errorResponse = ErrorResponse.internalError();
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }
  }
}

module.exports = RegistrationController;
