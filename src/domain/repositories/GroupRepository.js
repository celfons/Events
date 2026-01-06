/**
 * Interface for Group Repository
 * Defines the contract for group data persistence
 */
class GroupRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByName(name) {
    throw new Error('Method not implemented');
  }

  async findAll(page = 1, limit = 10) {
    throw new Error('Method not implemented');
  }

  async create(group) {
    throw new Error('Method not implemented');
  }

  async update(id, group) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = GroupRepository;
