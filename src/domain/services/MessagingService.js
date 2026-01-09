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
}

module.exports = MessagingService;
