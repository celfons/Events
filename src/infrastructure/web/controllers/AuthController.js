class AuthController {
  constructor(loginUseCase, registerUseCase) {
    this.loginUseCase = loginUseCase;
    this.registerUseCase = registerUseCase;
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await this.loginUseCase.execute(email, password);

      if (!result.success) {
        const error = new Error(result.error);
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        throw error;
      }

      return res.status(200).json(result.data);
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const result = await this.registerUseCase.execute(req.body);

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
}

module.exports = AuthController;
