class SendEventRemindersUseCase {
  constructor(eventRepository, registrationRepository, whatsAppService) {
    this.eventRepository = eventRepository;
    this.registrationRepository = registrationRepository;
    this.whatsAppService = whatsAppService;
  }

  async execute({ hoursAhead = 24 } = {}) {
    try {
      // Validate input
      if (typeof hoursAhead !== 'number' || hoursAhead < 0) {
        return {
          success: false,
          error: 'hoursAhead must be a positive number'
        };
      }

      // Calculate time window for upcoming events
      const now = new Date();
      const startTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour window

      // Find upcoming events
      const events = await this.eventRepository.findUpcomingEvents(startTime, endTime);

      if (events.length === 0) {
        return {
          success: true,
          message: 'No upcoming events found',
          data: {
            eventsProcessed: 0,
            messagesSent: 0,
            messagesFailed: 0
          }
        };
      }

      const results = [];

      // Process each event
      for (const event of events) {
        // Get participants for the event
        const participants = await this.registrationRepository.findByEventId(event.id);

        if (participants.length === 0) {
          results.push({
            eventId: event.id,
            eventTitle: event.title,
            participantsCount: 0,
            messagesSent: 0
          });
          continue;
        }

        // Prepare messages for participants
        const recipients = participants.map(participant => ({
          phoneNumber: participant.phone,
          message: this._buildReminderMessage(event, participant)
        }));

        // Send bulk messages
        const sendResult = await this.whatsAppService.sendBulkMessages(recipients);

        results.push({
          eventId: event.id,
          eventTitle: event.title,
          participantsCount: participants.length,
          messagesSent: sendResult.successful,
          messagesFailed: sendResult.failed
        });
      }

      // Calculate totals
      const totalMessagesSent = results.reduce((sum, r) => sum + r.messagesSent, 0);
      const totalMessagesFailed = results.reduce((sum, r) => sum + r.messagesFailed, 0);

      return {
        success: true,
        message: `Reminders sent for ${events.length} event(s)`,
        data: {
          eventsProcessed: events.length,
          messagesSent: totalMessagesSent,
          messagesFailed: totalMessagesFailed,
          details: results
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  _buildReminderMessage(event, participant) {
    const dateTime = new Date(event.dateTime);
    const formattedDate = dateTime.toLocaleDateString('pt-BR');
    const formattedTime = dateTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `Olá ${participant.name}! 👋\n\n` +
           `Lembrete: O evento "${event.title}" está chegando!\n\n` +
           `📅 Data: ${formattedDate}\n` +
           `⏰ Horário: ${formattedTime}\n\n` +
           `Nos vemos lá! 🎉`;
  }
}

module.exports = SendEventRemindersUseCase;
