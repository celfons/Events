const logger = require('../../infrastructure/logging/logger');

class CancelRegistrationUseCase {
  constructor(eventRepository, messagingService = null) {
    this.eventRepository = eventRepository;
    this.messagingService = messagingService;
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
      const participant = event.participants.find(
        p => p.id === participantId && (p.status === 'pending' || p.status === 'confirmed')
      );
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

      // Send WhatsApp cancellation message (async, don't block cancellation)
      if (this.messagingService) {
        this.messagingService
          .sendCancellationConfirmation({
            to: participant.phone,
            name: participant.name,
            eventTitle: event.title
          })
          .catch(error => {
            logger.error('Failed to send WhatsApp cancellation message', {
              error: error.message,
              participantId
            });
          });
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
