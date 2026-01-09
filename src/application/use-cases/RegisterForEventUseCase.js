const Registration = require('../../domain/entities/Registration');
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

      // Add participant to event (atomically decrements slots)
      const registration = await this.eventRepository.addParticipant(registrationData.eventId, {
        name: registrationData.name,
        email: registrationData.email,
        phone: registrationData.phone,
        status: 'active'
      });

      if (!registration) {
        return {
          success: false,
          error: 'Failed to register. Event may be full or was deleted.'
        };
      }

      // Send WhatsApp confirmation message (async, don't block registration)
      if (this.messagingService) {
        this.messagingService
          .sendRegistrationConfirmation({
            to: registrationData.phone,
            name: registrationData.name,
            eventTitle: event.title,
            eventDate: event.dateTime,
            eventLocal: event.local
          })
          .catch(error => {
            logger.error('Failed to send WhatsApp confirmation', {
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
