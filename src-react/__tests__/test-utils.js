/**
 * Shared test utilities and helper functions
 */

/**
 * Helper function to verify Bootstrap icon classes
 * @param {string} iconClass - The icon class to verify (e.g., 'bi bi-search')
 * @param {string} iconName - The specific icon name (e.g., 'bi-search')
 */
export function verifyBootstrapIconClass(iconClass, iconName) {
  expect(iconClass).toContain('bi');
  expect(iconClass).toContain(iconName);
}

/**
 * Creates a mock successful fetch response
 * @param {*} data - The data to return
 * @returns {Promise} Mock response
 */
export function mockSuccessFetchResponse(data) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data })
  });
}

/**
 * Creates a mock error fetch response
 * @param {string} error - The error message
 * @returns {Promise} Mock response
 */
export function mockErrorFetchResponse(error) {
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ error })
  });
}

/**
 * Setup common mocks for React components and hooks
 */
export function setupCommonMocks() {
  // Mock fetch
  global.fetch = jest.fn();

  // Clear all mocks
  jest.clearAllMocks();
}

/**
 * Cleanup after tests
 */
export function cleanupAfterTests() {
  jest.restoreAllMocks();
}
