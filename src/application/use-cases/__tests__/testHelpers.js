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

/**
 * Expect a failed result with error message
 * @param {Object} result - Result object to test
 * @param {string} errorMessage - Expected error message
 */
function expectFailedResult(result, errorMessage) {
  expect(result.success).toBe(false);
  expect(result.error).toBe(errorMessage);
}

/**
 * Expect a successful result
 * @param {Object} result - Result object to test
 */
function expectSuccessfulResult(result) {
  expect(result.success).toBe(true);
}

module.exports = {
  createMockEvent,
  expectFailedResult,
  expectSuccessfulResult
};
