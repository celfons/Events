class GetEventParticipantsUseCase {
  constructor(eventRepository) {
    this.eventRepository = eventRepository;
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

      // Get active participants from the event
      const participants = event.participants.filter(p => p.status === 'active');

      return {
        success: true,
        data: participants.map(p => ({
          id: p.id,
          eventId: eventId,
          name: p.name,
          email: p.email,
          phone: p.phone,
          registeredAt: p.registeredAt,
          status: p.status
        }))
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
