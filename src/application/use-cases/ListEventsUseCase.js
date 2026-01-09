class ListEventsUseCase {
  constructor(eventRepository) {
    this.eventRepository = eventRepository;
  }

  async execute(eventCode = null) {
    try {
      // If eventCode is provided, find by code, otherwise list all
      if (eventCode) {
        const event = await this.eventRepository.findByEventCode(eventCode);
        if (!event) {
          return {
            success: true,
            data: []
          };
        }
        return {
          success: true,
          data: [event.toJSON()]
        };
      }

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
