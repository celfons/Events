class ListEventsUseCase {
  constructor(eventRepository) {
    this.eventRepository = eventRepository;
  }

  async execute() {
    try {
      const events = await this.eventRepository.findAll();
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

module.exports = ListEventsUseCase;
