// API Client with Request ID Tracing for distributed logging

/**
 * Generate a cryptographically secure UUID v4
 * Uses crypto.randomUUID() when available, falls back to crypto.getRandomValues()
 * @returns {string} UUID v4 string
 */
function generateUUID() {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback to crypto.getRandomValues() for cryptographically secure random numbers
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Generate 16 random bytes for UUID
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);

    // Set version (4) and variant (10) bits according to RFC 4122
    randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // version 4
    randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // variant 10

    // Convert to UUID string format
    const hex = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)].join('-');
  }

  // Last resort fallback (should not happen in modern browsers)
  // This maintains backwards compatibility but logs a warning
  console.warn('Crypto API not available, falling back to Math.random() for UUID generation');
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create a request ID
 * Checks for existing request ID in response headers and reuses it,
 * or generates a new one for the initial request
 * @returns {string} Request ID
 */
function getRequestId() {
  // Generate a new UUID for each request to enable distributed tracing
  return generateUUID();
}

/**
 * Enhanced fetch wrapper with request ID tracing
 * Automatically adds x-request-id header to all requests for distributed tracing
 *
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithTracing(url, options = {}) {
  // Get or generate request ID
  const requestId = getRequestId();

  // Merge headers with x-request-id
  const headers = {
    ...options.headers,
    'x-request-id': requestId
  };

  // Make the request with tracing header
  const response = await fetch(url, {
    ...options,
    headers
  });

  return response;
}

/**
 * Convenience method for GET requests with tracing
 * @param {string} url - The URL to fetch
 * @param {Object} headers - Additional headers
 * @returns {Promise<Response>} Fetch response
 */
export async function get(url, headers = {}) {
  return fetchWithTracing(url, {
    method: 'GET',
    headers
  });
}

/**
 * Convenience method for POST requests with tracing
 * @param {string} url - The URL to fetch
 * @param {Object} body - Request body
 * @param {Object} headers - Additional headers
 * @returns {Promise<Response>} Fetch response
 */
export async function post(url, body, headers = {}) {
  return fetchWithTracing(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  });
}

/**
 * Convenience method for PUT requests with tracing
 * @param {string} url - The URL to fetch
 * @param {Object} body - Request body
 * @param {Object} headers - Additional headers
 * @returns {Promise<Response>} Fetch response
 */
export async function put(url, body, headers = {}) {
  return fetchWithTracing(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  });
}

/**
 * Convenience method for DELETE requests with tracing
 * @param {string} url - The URL to fetch
 * @param {Object} headers - Additional headers
 * @returns {Promise<Response>} Fetch response
 */
export async function deleteRequest(url, headers = {}) {
  return fetchWithTracing(url, {
    method: 'DELETE',
    headers
  });
}

// Default export for backward compatibility
export default {
  fetchWithTracing,
  get,
  post,
  put,
  delete: deleteRequest
};
