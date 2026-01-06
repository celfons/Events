/**
 * Interface for User Repository
 * Defines the contract for user data persistence
 */
class UserRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByUsername(username) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async findAll(page = 1, limit = 10) {
    throw new Error('Method not implemented');
  }

  async create(user) {
    throw new Error('Method not implemented');
  }

  async update(id, user) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = UserRepository;
