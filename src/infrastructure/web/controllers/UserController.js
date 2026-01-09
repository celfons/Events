const { ErrorResponse, SuccessResponse, UserResponse } = require('../dto');

class UserController {
  constructor(listUsersUseCase, updateUserUseCase, deleteUserUseCase, registerUseCase) {
    this.listUsersUseCase = listUsersUseCase;
    this.updateUserUseCase = updateUserUseCase;
    this.deleteUserUseCase = deleteUserUseCase;
    this.registerUseCase = registerUseCase;
  }

  async listUsers(req, res) {
    const result = await this.listUsersUseCase.execute();

    if (!result.success) {
      const errorResponse = ErrorResponse.invalidInput(result.error);
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }

    const users = UserResponse.fromEntities(result.data);
    const successResponse = SuccessResponse.list(users);
    return res.status(200).json(successResponse.toJSON());
  }

  async createUser(req, res) {
    const result = await this.registerUseCase.execute(req.body);

    if (!result.success) {
      const errorResponse = ErrorResponse.invalidInput(result.error);
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }

    const user = UserResponse.fromEntity(result.data);
    const successResponse = SuccessResponse.created(user);
    return res.status(201).json(successResponse.toJSON());
  }

  async updateUser(req, res) {
    const { id } = req.params;
    const result = await this.updateUserUseCase.execute(id, req.body);

    if (!result.success) {
      const errorResponse = ErrorResponse.invalidInput(result.error);
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }

    const user = UserResponse.fromEntity(result.data);
    const successResponse = SuccessResponse.updated(user);
    return res.status(200).json(successResponse.toJSON());
  }

  async deleteUser(req, res) {
    const { id } = req.params;
    const result = await this.deleteUserUseCase.execute(id);

    if (!result.success) {
      const errorResponse = ErrorResponse.invalidInput(result.error);
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }

    const successResponse = SuccessResponse.deleted('User deleted successfully');
    return res.status(200).json(successResponse.toJSON());
  }
}

module.exports = UserController;
