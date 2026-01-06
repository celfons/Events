class ListUserEventsUseCase {
  constructor(eventRepository) {
    this.eventRepository = eventRepository;
  }

  async execute(userId) {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      const events = await this.eventRepository.findByUserId(userId);
      return {
        success: true,
        data: events.map(event => event.toJSON())
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ListUserEventsUseCase;
