class UserController {
  constructor(listUsersUseCase, updateUserUseCase, deleteUserUseCase, registerUseCase) {
    this.listUsersUseCase = listUsersUseCase;
    this.updateUserUseCase = updateUserUseCase;
    this.deleteUserUseCase = deleteUserUseCase;
    this.registerUseCase = registerUseCase;
  }

  async listUsers(req, res, next) {
    try {
      const result = await this.listUsersUseCase.execute();

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

  async createUser(req, res, next) {
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

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.updateUserUseCase.execute(id, req.body);

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

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.deleteUserUseCase.execute(id);

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

module.exports = UserController;
