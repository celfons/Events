const logger = require('../../infrastructure/logging/logger');

class RegisterForEventUseCase {
  constructor(eventRepository, messagingService = null) {
    this.eventRepository = eventRepository;
    this.messagingService = messagingService;
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

      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Add participant to event with pending status (doesn't decrement slots yet)
      const registration = await this.eventRepository.addParticipant(registrationData.eventId, {
        name: registrationData.name,
        email: registrationData.email,
        phone: registrationData.phone,
        status: 'pending',
        verificationCode,
        verificationCodeExpiresAt
      });

      if (!registration) {
        return {
          success: false,
          error: 'Failed to register. Event may be full or was deleted.'
        };
      }

      // Send WhatsApp verification code (async, don't block registration)
      if (this.messagingService) {
        this.messagingService
          .sendVerificationCode({
            to: registrationData.phone,
            name: registrationData.name,
            eventTitle: event.title,
            verificationCode
          })
          .catch(error => {
            logger.error('Failed to send WhatsApp verification code', {
              error: error.message,
              registrationId: registration.id
            });
          });
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
