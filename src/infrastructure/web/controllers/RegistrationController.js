const { ValidationError } = require('../../../domain/exceptions');
const { SuccessResponse, RegistrationResponse } = require('../dto');
const asyncHandler = require('../middleware/asyncHandler');

class RegistrationController {
  constructor(registerForEventUseCase, cancelRegistrationUseCase) {
    this.registerForEventUseCase = registerForEventUseCase;
    this.cancelRegistrationUseCase = cancelRegistrationUseCase;
  }

  async register(req, res) {
    const result = await this.registerForEventUseCase.execute(req.body);

    if (!result.success) {
      throw new ValidationError(result.error);
    }

    const registration = RegistrationResponse.fromEntity(result.data);
    const successResponse = SuccessResponse.created(registration, 'Registration created successfully');
    return res.status(201).json(successResponse.toJSON());
  }

  async cancel(req, res) {
    const { id } = req.params;
    const { eventId } = req.body;

    if (!eventId) {
      throw new ValidationError('eventId is required in request body');
    }

    const result = await this.cancelRegistrationUseCase.execute(eventId, id);

    if (!result.success) {
      throw new ValidationError(result.error);
    }

    const successResponse = SuccessResponse.ok(null, result.message);
    return res.status(200).json(successResponse.toJSON());
  }
}

// Wrap methods with asyncHandler
RegistrationController.prototype.register = asyncHandler(RegistrationController.prototype.register);
RegistrationController.prototype.cancel = asyncHandler(RegistrationController.prototype.cancel);

module.exports = RegistrationController;
