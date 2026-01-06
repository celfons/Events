class GetEventDetailsUseCase {
  constructor(eventRepository, registrationRepository) {
    this.eventRepository = eventRepository;
    this.registrationRepository = registrationRepository;
  }

  async execute(eventId) {
    try {
      const event = await this.eventRepository.findById(eventId);
      
      if (!event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      const registrations = await this.registrationRepository.findByEventId(eventId);
      
      return {
        success: true,
        data: {
          event: event.toJSON(),
          registrationsCount: registrations.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = GetEventDetailsUseCase;
