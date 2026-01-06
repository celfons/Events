const Registration = require('../../domain/entities/Registration');

class RegisterForEventUseCase {
  constructor(eventRepository, registrationRepository) {
    this.eventRepository = eventRepository;
    this.registrationRepository = registrationRepository;
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
      const existingRegistration = await this.registrationRepository.findByEventAndEmail(
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

      // Create registration
      const registration = new Registration({
        eventId: registrationData.eventId,
        name: registrationData.name,
        email: registrationData.email,
        phone: registrationData.phone
      });

      const createdRegistration = await this.registrationRepository.create(registration);

      // Atomically decrement available slots in the database
      const updatedEvent = await this.eventRepository.decrementAvailableSlots(event.id);
      
      if (!updatedEvent) {
        // Event was deleted during registration - rollback
        await this.registrationRepository.delete(createdRegistration.id);
        return {
          success: false,
          error: 'Event was deleted during registration'
        };
      }

      return {
        success: true,
        data: createdRegistration.toJSON()
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
