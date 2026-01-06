class CancelRegistrationUseCase {
  constructor(eventRepository, registrationRepository) {
    this.eventRepository = eventRepository;
    this.registrationRepository = registrationRepository;
  }

  async execute(registrationId) {
    try {
      // Find registration
      const registration = await this.registrationRepository.findById(registrationId);
      if (!registration) {
        return {
          success: false,
          error: 'Registration not found'
        };
      }

      // Check if already cancelled
      if (!registration.isActive()) {
        return {
          success: false,
          error: 'Registration is already cancelled'
        };
      }

      // Find event
      const event = await this.eventRepository.findById(registration.eventId);
      if (!event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      // Cancel registration
      registration.cancel();
      await this.registrationRepository.update(registrationId, {
        status: registration.status
      });

      // Increment available slots
      event.incrementSlots();
      await this.eventRepository.update(event.id, {
        availableSlots: event.availableSlots
      });

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
