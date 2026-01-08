class UserController {
  constructor(listUsersUseCase, updateUserUseCase, deleteUserUseCase, registerUseCase) {
    this.listUsersUseCase = listUsersUseCase;
    this.updateUserUseCase = updateUserUseCase;
    this.deleteUserUseCase = deleteUserUseCase;
    this.registerUseCase = registerUseCase;
  }

  async listUsers(req, res) {
    try {
      const result = await this.listUsersUseCase.execute();

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createUser(req, res) {
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

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const result = await this.updateUserUseCase.execute(id, req.body);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await this.deleteUserUseCase.execute(id);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = UserController;
