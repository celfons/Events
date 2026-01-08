class CancelRegistrationUseCase {
  constructor(eventRepository) {
    this.eventRepository = eventRepository;
  }

  async execute(eventId, participantId) {
    try {
      // Validate input
      if (!eventId || !participantId) {
        return {
          success: false,
          error: 'Event ID and Participant ID are required'
        };
      }

      // Find event
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      // Find participant in the event
      const participant = event.participants.find(p => p.id === participantId && p.status === 'active');
      if (!participant) {
        return {
          success: false,
          error: 'Active registration not found'
        };
      }

      // Cancel participant (atomically increments slots)
      const success = await this.eventRepository.cancelParticipant(eventId, participantId);

      if (!success) {
        return {
          success: false,
          error: 'Failed to cancel registration'
        };
      }

      return {
        success: true,
        message: 'Registration cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CancelRegistrationUseCase;
