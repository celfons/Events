const { ValidationError, UnauthorizedError } = require('../../../domain/exceptions');
const { SuccessResponse, LoginResponse, UserResponse } = require('../dto');
const asyncHandler = require('../middleware/asyncHandler');

class AuthController {
  constructor(loginUseCase, registerUseCase) {
    this.loginUseCase = loginUseCase;
    this.registerUseCase = registerUseCase;
  }

  async login(req, res) {
    const { email, password } = req.body;
    const result = await this.loginUseCase.execute(email, password);

    if (!result.success) {
      throw new UnauthorizedError(result.error);
    }

    const loginResponse = LoginResponse.fromData(result.data);
    const successResponse = SuccessResponse.ok(loginResponse);
    return res.status(200).json(successResponse.toJSON());
  }

  async register(req, res) {
    const result = await this.registerUseCase.execute(req.body);

    if (!result.success) {
      throw new ValidationError(result.error);
    }

    const user = UserResponse.fromEntity(result.data);
    const successResponse = SuccessResponse.created(user);
    return res.status(201).json(successResponse.toJSON());
  }
}

// Wrap methods with asyncHandler
AuthController.prototype.login = asyncHandler(AuthController.prototype.login);
AuthController.prototype.register = asyncHandler(AuthController.prototype.register);

module.exports = AuthController;
