const logger = require('../../infrastructure/logging/logger');

class RegisterForEventUseCase {
  constructor(eventRepository, messagingService = null) {
    this.eventRepository = eventRepository;
    this.messagingService = messagingService;
  }

  async execute(registrationData, isAuthenticatedUser = false) {
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

      // Check if event has available slots (considering only confirmed participants)
      const activeParticipants = (event.participants || []).filter(p => p.status === 'confirmed').length;

      if (activeParticipants >= event.totalSlots) {
        return {
          success: false,
          error: 'No available slots for this event'
        };
      }

      // Determine registration status based on authentication
      // Authenticated users (admins) register participants as confirmed immediately
      // Public users register as pending and need verification
      const isConfirmedRegistration = isAuthenticatedUser;
      const status = isConfirmedRegistration ? 'confirmed' : 'pending';

      // Generate verification code only for pending registrations
      let verificationCode = null;
      let verificationCodeExpiresAt = null;

      if (!isConfirmedRegistration) {
        verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      // Add participant to event
      // Confirmed registrations decrement slots immediately
      // Pending registrations don't decrement slots until confirmed
      const participantData = {
        name: registrationData.name,
        email: registrationData.email,
        phone: registrationData.phone,
        status: status
      };

      // Only include verification code fields for pending registrations
      if (verificationCode) {
        participantData.verificationCode = verificationCode;
        participantData.verificationCodeExpiresAt = verificationCodeExpiresAt;
      }

      // For confirmed registrations, set confirmedAt timestamp
      if (isConfirmedRegistration) {
        participantData.confirmedAt = new Date();
      }

      const registration = await this.eventRepository.addParticipant(registrationData.eventId, participantData);

      if (!registration) {
        return {
          success: false,
          error: 'No available slots for this event'
        };
      }

      // Send WhatsApp verification code only for pending registrations (async, don't block registration)
      if (this.messagingService && !isConfirmedRegistration && verificationCode) {
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
