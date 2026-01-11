const logger = require('../../infrastructure/logging/logger');
const { getConfirmedParticipants } = require('./helpers/notificationHelper');

/**
 * Use case for sending event reminders to confirmed participants
 * This can be triggered manually by administrators or scheduled
 */
class SendEventReminderUseCase {
  constructor(eventRepository, messagingService = null) {
    this.eventRepository = eventRepository;
    this.messagingService = messagingService;
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

      // Check if messaging service is available
      if (!this.messagingService) {
        return {
          success: false,
          error: 'Messaging service is not configured'
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

      // Get confirmed participants
      const confirmedParticipants = getConfirmedParticipants(event);

      if (confirmedParticipants.length === 0) {
        return {
          success: false,
          error: 'No confirmed participants to send reminders to'
        };
      }

      // Send reminders to all confirmed participants
      const results = {
        total: confirmedParticipants.length,
        sent: 0,
        failed: 0,
        errors: []
      };

      for (const participant of confirmedParticipants) {
        try {
          const result = await this.messagingService.sendEventReminder({
            to: participant.phone,
            name: participant.name,
            eventTitle: event.title,
            eventDate: event.dateTime,
            eventLocal: event.local
          });

          if (result.success) {
            results.sent++;
          } else {
            results.failed++;
            results.errors.push({
              participantId: participant.id,
              error: result.error || 'Unknown error'
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            participantId: participant.id,
            error: error.message
          });

          logger.error('Failed to send event reminder', {
            error: error.message,
            participantId: participant.id,
            eventId
          });
        }
      }

      return {
        success: true,
        message: `Event reminders sent: ${results.sent} successful, ${results.failed} failed`,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SendEventReminderUseCase;
