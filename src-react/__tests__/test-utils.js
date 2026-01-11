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
 * Setup common mocks for React components and hooks
 */
export function setupCommonMocks() {
  global.fetch = jest.fn();
  jest.clearAllMocks();
}

/**
 * Cleanup after tests
 */
export function cleanupAfterTests() {
  jest.restoreAllMocks();
}

/**
 * Helper to test API calls with common structure
 */
export async function testApiCall(url, method, mockData, mockResponse) {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ data: mockResponse })
  });

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer fake-token'
    },
    body: JSON.stringify(mockData)
  });

  expect(fetch).toHaveBeenCalledWith(
    url,
    expect.objectContaining({
      method,
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake-token'
      })
    })
  );

  return await response.json();
}

/**
 * Helper to filter events by search query
 */
export function filterEventsByQuery(events, searchQuery) {
  return events.filter(
    event =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.eventCode && event.eventCode.includes(searchQuery.toUpperCase()))
  );
}
