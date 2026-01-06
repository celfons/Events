const Registration = require('../../domain/entities/Registration');

class RegisterForEventUseCase {
  constructor(eventRepository) {
    this.eventRepository = eventRepository;
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

      // Check if user already registered
      const existingRegistration = await this.eventRepository.findParticipantByEmail(
        registrationData.eventId,
        registrationData.email
      );

      if (existingRegistration) {
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
