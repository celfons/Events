class AuthController {
  constructor(loginUseCase, registerUserUseCase) {
    this.loginUseCase = loginUseCase;
    this.registerUserUseCase = registerUserUseCase;
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await this.loginUseCase.execute(username, password);

      // Store user in session
      req.session.userId = user.id;
      req.session.username = user.username;

      res.json({ 
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          groups: user.groups
        }
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async register(req, res) {
    try {
      const { username, email, password, groups } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }

      const user = await this.registerUserUseCase.execute(username, email, password, groups || []);

      res.status(201).json({ 
        success: true,
        user 
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  }

  async getCurrentUser(req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
      id: req.session.userId,
      username: req.session.username
    });
  }
}

module.exports = AuthController;
