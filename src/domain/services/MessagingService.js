/**
 * Interface for messaging services
 * This defines the contract that any messaging adapter must implement
 */
class MessagingService {
  /**
   * Send a registration confirmation message
   * @param {Object} _params - Message parameters
   * @param {string} _params.to - Recipient phone number (E.164 format)
   * @param {string} _params.name - Participant name
   * @param {string} _params.eventTitle - Event title
   * @param {Date} _params.eventDate - Event date
   * @param {string} _params.eventLocal - Event location
   * @returns {Promise<Object>} - Result with success status and message ID
   */
  async sendRegistrationConfirmation(_params) {
    throw new Error('Method not implemented');
  }

  /**
   * Send a cancellation confirmation message
   * @param {Object} _params - Message parameters
   * @param {string} _params.to - Recipient phone number (E.164 format)
   * @param {string} _params.name - Participant name
   * @param {string} _params.eventTitle - Event title
   * @returns {Promise<Object>} - Result with success status and message ID
   */
  async sendCancellationConfirmation(_params) {
    throw new Error('Method not implemented');
  }

  /**
   * Send an event reminder message
   * @param {Object} _params - Message parameters
   * @param {string} _params.to - Recipient phone number (E.164 format)
   * @param {string} _params.name - Participant name
   * @param {string} _params.eventTitle - Event title
   * @param {Date} _params.eventDate - Event date
   * @param {string} _params.eventLocal - Event location
   * @returns {Promise<Object>} - Result with success status and message ID
   */
  async sendEventReminder(_params) {
    throw new Error('Method not implemented');
  }

  /**
   * Send a verification code message
   * @param {Object} _params - Message parameters
   * @param {string} _params.to - Recipient phone number (E.164 format)
   * @param {string} _params.name - Participant name
   * @param {string} _params.eventTitle - Event title
   * @param {string} _params.verificationCode - Verification code
   * @returns {Promise<Object>} - Result with success status and message ID
   */
  async sendVerificationCode(_params) {
    throw new Error('Method not implemented');
  }

  /**
   * Send a registration error notification
   * @param {Object} _params - Message parameters
   * @param {string} _params.to - Recipient phone number (E.164 format)
   * @param {string} _params.name - Participant name
   * @param {string} _params.eventTitle - Event title
   * @param {string} _params.error - Error message
   * @returns {Promise<Object>} - Result with success status and message ID
   */
  async sendRegistrationError(_params) {
    throw new Error('Method not implemented');
  }

  /**
   * Send an event update notification
   * @param {Object} _params - Message parameters
   * @param {string} _params.to - Recipient phone number (E.164 format)
   * @param {string} _params.name - Participant name
   * @param {string} _params.eventTitle - Event title
   * @param {Date} _params.newDate - New event date (optional)
   * @param {string} _params.newLocal - New event location (optional)
   * @returns {Promise<Object>} - Result with success status and message ID
   */
  async sendEventUpdate(_params) {
    throw new Error('Method not implemented');
  }
}

module.exports = MessagingService;
