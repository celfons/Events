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
        return res.status(401).json({ error: result.error });
      }

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async register(req, res) {
    try {
      const result = await this.registerUseCase.execute(req.body);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = AuthController;
