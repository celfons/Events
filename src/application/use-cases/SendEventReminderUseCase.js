const logger = require('../../infrastructure/logging/logger');
const { getConfirmedParticipants, sendNotificationsWithTracking } = require('./helpers/notificationHelper');

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
      const results = await sendNotificationsWithTracking(
        confirmedParticipants,
        participant =>
          this.messagingService.sendEventReminder({
            to: participant.phone,
            name: participant.name,
            eventTitle: event.title,
            eventDate: event.dateTime,
            eventLocal: event.local
          }),
        { eventId, action: 'event reminder' }
      );

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
