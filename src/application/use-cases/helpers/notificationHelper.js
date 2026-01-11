const logger = require('../../../infrastructure/logging/logger');

/**
 * Helper functions for notification operations in use cases
 */

/**
 * Get confirmed participants from an event
 * @param {Object} event - Event object with participants array
 * @returns {Array} - Array of confirmed participants
 */
function getConfirmedParticipants(event) {
  return event.participants.filter(p => p.status === 'confirmed');
}

/**
 * Send notifications to participants with error handling
 * @param {Array} participants - Array of participants to notify
 * @param {Function} sendFunction - Async function to send notification
 * @param {Object} context - Context object with eventId and other metadata for logging
 * @returns {Promise<void>}
 */
async function sendNotificationsWithErrorHandling(participants, sendFunction, context = {}) {
  const promises = participants.map(participant =>
    sendFunction(participant).catch(error => {
      logger.error('Failed to send notification', {
        error: error.message,
        participantId: participant.id,
        ...context
      });
      return { success: false, error: error.message };
    })
  );

  await Promise.allSettled(promises);
}

/**
 * Send notifications with result tracking
 * @param {Array} participants - Array of participants to notify
 * @param {Function} sendFunction - Async function to send notification
 * @param {Object} context - Context object with eventId and other metadata for logging
 * @returns {Promise<Object>} - Results object with total, sent, failed, and errors
 */
async function sendNotificationsWithTracking(participants, sendFunction, context = {}) {
  const results = {
    total: participants.length,
    sent: 0,
    failed: 0,
    errors: []
  };

  for (const participant of participants) {
    try {
      const result = await sendFunction(participant);

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push({
          participantId: participant.id,
          error: result.error || 'Unknown error'
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        participantId: participant.id,
        error: error.message
      });

      logger.error('Failed to send notification', {
        error: error.message,
        participantId: participant.id,
        ...context
      });
    }
  }

  return results;
}

module.exports = {
  getConfirmedParticipants,
  sendNotificationsWithErrorHandling,
  sendNotificationsWithTracking
};
