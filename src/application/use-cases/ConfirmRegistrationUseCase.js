const logger = require('../../infrastructure/logging/logger');

class ConfirmRegistrationUseCase {
  constructor(eventRepository, messagingService = null) {
    this.eventRepository = eventRepository;
    this.messagingService = messagingService;
  }

  async execute(eventId, participantId, verificationCode) {
    try {
      // Validate input
      if (!eventId || !participantId || !verificationCode) {
        return {
          success: false,
          error: 'Event ID, Participant ID, and Verification Code are required'
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
      const participant = event.participants.find(p => p.id === participantId && p.status === 'pending');
      if (!participant) {
        return {
          success: false,
          error: 'Pending registration not found'
        };
      }

      // Check if verification code has expired
      if (new Date() > new Date(participant.verificationCodeExpiresAt)) {
        return {
          success: false,
          error: 'Verification code has expired'
        };
      }

      // Verify the code
      if (participant.verificationCode !== verificationCode) {
        return {
          success: false,
          error: 'Invalid verification code'
        };
      }

      // Check if event still has available slots
      const confirmedParticipants = event.participants.filter(p => p.status === 'confirmed').length;
      if (confirmedParticipants >= event.totalSlots) {
        return {
          success: false,
          error: 'No available slots for this event'
        };
      }

      // Confirm participant
      const success = await this.eventRepository.confirmParticipant(eventId, participantId);

      if (!success) {
        return {
          success: false,
          error: 'Failed to confirm registration'
        };
      }

      // Send WhatsApp confirmation message (async, don't block confirmation)
      if (this.messagingService) {
        this.messagingService
          .sendRegistrationConfirmation({
            to: participant.phone,
            name: participant.name,
            eventTitle: event.title,
            eventDate: event.dateTime,
            eventLocal: event.local
          })
          .catch(error => {
            logger.error('Failed to send WhatsApp confirmation', {
              error: error.message,
              participantId
            });
          });
      }

      return {
        success: true,
        message: 'Registration confirmed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ConfirmRegistrationUseCase;
