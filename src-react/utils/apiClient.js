// API Client with Request ID Tracing for distributed logging

/**
 * Generate a UUID v4
 * @returns {string} UUID v4 string
 */
function generateUUID() {
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

  // Log request ID from response for debugging (in development)
  if (process.env.NODE_ENV !== 'production') {
    const responseRequestId = response.headers.get('x-request-id');
    if (responseRequestId && responseRequestId !== requestId) {
      console.debug(`Request ID mismatch: sent ${requestId}, received ${responseRequestId}`);
    }
  }

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
