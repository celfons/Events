class VerifyRegistrationUseCase {
  constructor(eventRepository, whatsAppService = null, locale = 'pt-BR') {
    this.eventRepository = eventRepository;
    this.whatsAppService = whatsAppService;
    this.locale = locale;
    this.VERIFICATION_CODE_EXPIRY_HOURS = 24;
  }

  async execute(eventId, participantId, verificationCode) {
    try {
      // Validate input
      if (!eventId || !participantId || !verificationCode) {
        return {
          success: false,
          error: 'Missing required fields: eventId, participantId, verificationCode'
        };
      }

      // Get event
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      // Find participant in event
      const participant = event.participants.find(
        p => p.id === participantId && p.status === 'pending'
      );

      if (!participant) {
        return {
          success: false,
          error: 'Pending registration not found'
        };
      }

      // Check if already verified
      if (participant.verified) {
        return {
          success: false,
          error: 'Registration already verified'
        };
      }

      // Verify code
      if (participant.verificationCode !== verificationCode.trim()) {
        return {
          success: false,
          error: 'Invalid verification code'
        };
      }

      // Check if code expired
      const registrationTime = new Date(participant.registeredAt);
      const now = new Date();
      const hoursSinceRegistration = (now - registrationTime) / (1000 * 60 * 60);
      
      if (hoursSinceRegistration > this.VERIFICATION_CODE_EXPIRY_HOURS) {
        return {
          success: false,
          error: 'Verification code expired. Please register again.'
        };
      }

      // Update participant status to active and mark as verified
      const updated = await this.eventRepository.verifyParticipant(eventId, participantId);
      
      if (!updated) {
        return {
          success: false,
          error: 'Failed to verify registration'
        };
      }

      // Send confirmation message via WhatsApp
      if (this.whatsAppService && participant.phone) {
        try {
          const eventDate = new Date(event.dateTime);
          const formattedDate = eventDate.toLocaleDateString(this.locale);
          const formattedTime = eventDate.toLocaleTimeString(this.locale, { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          const confirmationMessage = `✅ *Inscrição Confirmada!*\n\n` +
            `Olá ${participant.name}! 👋\n\n` +
            `Sua inscrição foi confirmada com sucesso!\n\n` +
            `📌 *${event.title}*\n` +
            `📝 ${event.description}\n` +
            `📅 Data: ${formattedDate}\n` +
            `⏰ Horário: ${formattedTime}\n` +
            `📍 Local: ${event.local || 'A definir'}\n\n` +
            `Aguardamos você! 🎉`;

          await this.whatsAppService.sendMessage(participant.phone, confirmationMessage);
          console.log(`📱 Confirmation message sent to ${participant.phone}`);
        } catch (error) {
          // Log error but don't fail the verification
          console.error(`⚠️  Failed to send WhatsApp confirmation to ${participant.phone}:`, error.message);
        }
      }

      return {
        success: true,
        message: 'Registration verified successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = VerifyRegistrationUseCase;
