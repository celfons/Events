const Registration = require('../../domain/entities/Registration');
const crypto = require('crypto');

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

      // Generate 6-digit verification code using cryptographically secure random
      const verificationCode = crypto.randomInt(100000, 999999).toString();

      // Add participant to event with pending status (atomically decrements slots)
      const registration = await this.eventRepository.addParticipant(
        registrationData.eventId,
        {
          name: registrationData.name,
          email: registrationData.email,
          phone: registrationData.phone,
          status: 'pending',
          verificationCode: verificationCode,
          verified: false
        }
      );
      
      if (!registration) {
        return {
          success: false,
          error: 'Failed to register. Event may be full or was deleted.'
        };
      }

      // Send WhatsApp verification code
      if (this.whatsAppService && registrationData.phone) {
        try {
          const eventDate = new Date(event.dateTime);
          const formattedDate = eventDate.toLocaleDateString(this.locale);
          const formattedTime = eventDate.toLocaleTimeString(this.locale, { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          const verificationMessage = `🔐 *Verificação de Cadastro*\n\n` +
            `Olá ${registrationData.name}! 👋\n\n` +
            `Seu código de verificação é:\n\n` +
            `*${verificationCode}*\n\n` +
            `Use este código para confirmar sua inscrição no evento:\n\n` +
            `📌 *${event.title}*\n` +
            `📅 ${formattedDate} às ${formattedTime}\n` +
            `📍 ${event.local || 'A definir'}\n\n` +
            `⚠️ Este código expira em 24 horas.`;

          await this.whatsAppService.sendMessage(registrationData.phone, verificationMessage);
          console.log(`📱 Verification code sent to ${registrationData.phone}`);
        } catch (error) {
          // Log error but don't fail the registration
          console.error(`⚠️  Failed to send WhatsApp verification to ${registrationData.phone}:`, error.message);
        }
      }

      return {
        success: true,
        data: registration.toJSON(),
        message: 'Registration pending. Please verify your phone number with the code sent via WhatsApp.'
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
