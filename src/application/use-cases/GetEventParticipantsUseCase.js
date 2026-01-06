class GetEventParticipantsUseCase {
  constructor(eventRepository, registrationRepository) {
    this.eventRepository = eventRepository;
    this.registrationRepository = registrationRepository;
  }

  async execute(eventId) {
    try {
      // Validate input
      if (!eventId) {
        return {
          success: false,
          error: 'Event ID is required'
        };
      }

      // Check if event exists
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      // Get all registrations for this event
      const registrations = await this.registrationRepository.findByEventId(eventId);

      return {
        success: true,
        data: registrations.map(reg => reg.toJSON())
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = GetEventParticipantsUseCase;
