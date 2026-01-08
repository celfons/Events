const { ValidationError } = require('../../../domain/exceptions');
const { SuccessResponse, UserResponse } = require('../dto');
const asyncHandler = require('../middleware/asyncHandler');

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
      throw new ValidationError(result.error);
    }

    const users = UserResponse.fromEntities(result.data);
    const successResponse = SuccessResponse.list(users);
    return res.status(200).json(successResponse.toJSON());
  }

  async createUser(req, res) {
    const result = await this.registerUseCase.execute(req.body);

    if (!result.success) {
      throw new ValidationError(result.error);
    }

    const user = UserResponse.fromEntity(result.data);
    const successResponse = SuccessResponse.created(user);
    return res.status(201).json(successResponse.toJSON());
  }

  async updateUser(req, res) {
    const { id } = req.params;
    const result = await this.updateUserUseCase.execute(id, req.body);

    if (!result.success) {
      throw new ValidationError(result.error);
    }

    const user = UserResponse.fromEntity(result.data);
    const successResponse = SuccessResponse.updated(user);
    return res.status(200).json(successResponse.toJSON());
  }

  async deleteUser(req, res) {
    const { id } = req.params;
    const result = await this.deleteUserUseCase.execute(id);

    if (!result.success) {
      throw new ValidationError(result.error);
    }

    const successResponse = SuccessResponse.deleted('User deleted successfully');
    return res.status(200).json(successResponse.toJSON());
  }
}

// Wrap methods with asyncHandler after class definition
// This approach maintains compatibility with ESLint and avoids arrow function binding issues
UserController.prototype.listUsers = asyncHandler(UserController.prototype.listUsers);
UserController.prototype.createUser = asyncHandler(UserController.prototype.createUser);
UserController.prototype.updateUser = asyncHandler(UserController.prototype.updateUser);
UserController.prototype.deleteUser = asyncHandler(UserController.prototype.deleteUser);

module.exports = UserController;
