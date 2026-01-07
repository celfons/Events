class EventRepository {
  async create(event) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async update(id, event) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async addParticipant(eventId, participantData) {
    throw new Error('Method not implemented');
  }

  async removeParticipant(eventId, participantId) {
    throw new Error('Method not implemented');
  }

  async findParticipantByEmail(eventId, email) {
    throw new Error('Method not implemented');
  }

  async findParticipantByPhone(eventId, phone) {
    throw new Error('Method not implemented');
  }

  async cancelParticipant(eventId, participantId) {
    throw new Error('Method not implemented');
  }

  async getParticipants(eventId) {
    throw new Error('Method not implemented');
  }

  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }
}

module.exports = EventRepository;
