/**
 * Shared test helper utilities for use case tests
 */

/**
 * Create a mock event with default values that can be overridden
 * @param {Object} overrides - Properties to override in the mock event
 * @returns {Object} - Mock event object
 */
function createMockEvent(overrides = {}) {
  return {
    id: '123',
    title: 'Test Event',
    dateTime: new Date('2024-12-31T10:00:00'),
    local: 'Test Location',
    participants: [{ id: '1', name: 'User', phone: '11987654321', email: 'user@test.com', status: 'confirmed' }],
    ...overrides
  };
}

module.exports = {
  createMockEvent
};
