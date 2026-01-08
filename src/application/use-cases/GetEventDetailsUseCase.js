class GetEventDetailsUseCase {
  constructor(eventRepository) {
    this.eventRepository = eventRepository;
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

      const activeParticipants = event.participants.filter(p => p.status === 'active');

      return {
        success: true,
        data: {
          event: event.toJSON(),
          registrationsCount: activeParticipants.length
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
