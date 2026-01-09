const { ErrorResponse, SuccessResponse, LoginResponse, UserResponse } = require('../dto');

class AuthController {
  constructor(loginUseCase, registerUseCase) {
    this.loginUseCase = loginUseCase;
    this.registerUseCase = registerUseCase;
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await this.loginUseCase.execute(email, password);

      if (!result.success) {
        const errorResponse = ErrorResponse.invalidCredentials(result.error);
        return res.status(errorResponse.status).json(errorResponse.toJSON());
      }

      const loginResponse = LoginResponse.fromData(result.data);
      const successResponse = SuccessResponse.ok(loginResponse);
      return res.status(200).json(successResponse.toJSON());
    } catch (error) {
      const errorResponse = ErrorResponse.internalError();
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }
  }

  async register(req, res) {
    try {
      const result = await this.registerUseCase.execute(req.body);

      if (!result.success) {
        const errorResponse = ErrorResponse.invalidInput(result.error);
        return res.status(errorResponse.status).json(errorResponse.toJSON());
      }

      const user = UserResponse.fromEntity(result.data);
      const successResponse = SuccessResponse.created(user);
      return res.status(201).json(successResponse.toJSON());
    } catch (error) {
      const errorResponse = ErrorResponse.internalError();
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }
  }
}

module.exports = AuthController;
