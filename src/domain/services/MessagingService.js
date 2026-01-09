/**
 * Interface for messaging services
 * This defines the contract that any messaging adapter must implement
 */
class MessagingService {
  /**
   * Send a registration confirmation message
   * @param {Object} params - Message parameters
   * @param {string} params.to - Recipient phone number (E.164 format)
   * @param {string} params.name - Participant name
   * @param {string} params.eventTitle - Event title
   * @param {Date} params.eventDate - Event date
   * @param {string} params.eventLocal - Event location
   * @returns {Promise<Object>} - Result with success status and message ID
   */
  async sendRegistrationConfirmation(params) {
    throw new Error('Method not implemented');
  }

  /**
   * Send a cancellation confirmation message
   * @param {Object} params - Message parameters
   * @param {string} params.to - Recipient phone number (E.164 format)
   * @param {string} params.name - Participant name
   * @param {string} params.eventTitle - Event title
   * @returns {Promise<Object>} - Result with success status and message ID
   */
  async sendCancellationConfirmation(params) {
    throw new Error('Method not implemented');
  }

  /**
   * Send an event reminder message
   * @param {Object} params - Message parameters
   * @param {string} params.to - Recipient phone number (E.164 format)
   * @param {string} params.name - Participant name
   * @param {string} params.eventTitle - Event title
   * @param {Date} params.eventDate - Event date
   * @param {string} params.eventLocal - Event location
   * @returns {Promise<Object>} - Result with success status and message ID
   */
  async sendEventReminder(params) {
    throw new Error('Method not implemented');
  }
}

module.exports = MessagingService;
