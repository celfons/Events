class CancelRegistrationUseCase {
  constructor(eventRepository, whatsAppService = null, locale = 'pt-BR') {
    this.eventRepository = eventRepository;
    this.whatsAppService = whatsAppService;
    this.locale = locale;
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

      // Send cancellation notification via WhatsApp
      if (this.whatsAppService && participant.phone) {
        try {
          const eventDate = new Date(event.dateTime);
          const formattedDate = eventDate.toLocaleDateString(this.locale);
          const formattedTime = eventDate.toLocaleTimeString(this.locale, { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          const cancellationMessage = `❌ *Inscrição Cancelada*\n\n` +
            `Olá ${participant.name}! 👋\n\n` +
            `Informamos que sua inscrição no evento foi cancelada.\n\n` +
            `📌 *${event.title}*\n` +
            `📅 Data: ${formattedDate}\n` +
            `⏰ Horário: ${formattedTime}\n` +
            `📍 Local: ${event.local || 'A definir'}\n\n` +
            `Se você não solicitou este cancelamento ou deseja se inscrever novamente, entre em contato com a organização do evento.`;

          await this.whatsAppService.sendMessage(participant.phone, cancellationMessage);
          console.log(`📱 Cancellation notification sent to ${participant.phone}`);
        } catch (error) {
          // Log error but don't fail the cancellation
          console.error(`⚠️  Failed to send WhatsApp cancellation notification to ${participant.phone}:`, error.message);
        }
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
