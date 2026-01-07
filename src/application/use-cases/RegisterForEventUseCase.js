const Registration = require('../../domain/entities/Registration');

class RegisterForEventUseCase {
  constructor(eventRepository, whatsAppService = null, locale = 'pt-BR') {
    this.eventRepository = eventRepository;
    this.whatsAppService = whatsAppService;
    this.locale = locale;
  }

  async execute(registrationData) {
    try {
      // Validate input
      if (!registrationData.eventId || !registrationData.name || !registrationData.email || !registrationData.phone) {
        return {
          success: false,
          error: 'Missing required fields: eventId, name, email, phone'
        };
      }

      // Check if event exists
      const event = await this.eventRepository.findById(registrationData.eventId);
      if (!event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      // Check if user already registered by phone
      const existingRegistrationByPhone = await this.eventRepository.findParticipantByPhone(
        registrationData.eventId,
        registrationData.phone
      );

      if (existingRegistrationByPhone) {
        return {
          success: false,
          error: 'A participant with this phone number is already registered for this event'
        };
      }

      // Check if user already registered by email
      const existingRegistrationByEmail = await this.eventRepository.findParticipantByEmail(
        registrationData.eventId,
        registrationData.email
      );

      if (existingRegistrationByEmail) {
        return {
          success: false,
          error: 'You are already registered for this event'
        };
      }

      // Check if event has available slots
      if (!event.hasAvailableSlots()) {
        return {
          success: false,
          error: 'No available slots for this event'
        };
      }

      // Add participant to event (atomically decrements slots)
      const registration = await this.eventRepository.addParticipant(
        registrationData.eventId,
        {
          name: registrationData.name,
          email: registrationData.email,
          phone: registrationData.phone,
          status: 'active'
        }
      );
      
      if (!registration) {
        return {
          success: false,
          error: 'Failed to register. Event may be full or was deleted.'
        };
      }

      // Send WhatsApp confirmation message
      if (this.whatsAppService && registrationData.phone) {
        try {
          const eventDate = new Date(event.dateTime);
          const formattedDate = eventDate.toLocaleDateString(this.locale);
          const formattedTime = eventDate.toLocaleTimeString(this.locale, { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          const confirmationMessage = `✅ *Inscrição Confirmada!*\n\n` +
            `Olá ${registrationData.name}! 👋\n\n` +
            `Sua inscrição foi confirmada com sucesso!\n\n` +
            `📌 *${event.title}*\n` +
            `📝 ${event.description}\n` +
            `📅 Data: ${formattedDate}\n` +
            `⏰ Horário: ${formattedTime}\n` +
            `📍 Local: ${event.local || 'A definir'}\n\n` +
            `Aguardamos você! 🎉`;

          await this.whatsAppService.sendMessage(registrationData.phone, confirmationMessage);
          console.log(`📱 Confirmation message sent to ${registrationData.phone}`);
        } catch (error) {
          // Log error but don't fail the registration
          console.error(`⚠️  Failed to send WhatsApp confirmation to ${registrationData.phone}:`, error.message);
        }
      }

      return {
        success: true,
        data: registration.toJSON()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = RegisterForEventUseCase;
