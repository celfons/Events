/**
 * @jest-environment jsdom
 *
 * Tests for API Client with request ID tracing
 */
import { fetchWithTracing, get, post, put, deleteRequest } from '../utils/apiClient';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client with Request ID Tracing', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers([['x-request-id', 'test-response-id']]),
      json: async () => ({ data: 'test' })
    });
  });

  describe('fetchWithTracing', () => {
    it('should add x-request-id header to requests', async () => {
      await fetchWithTracing('http://localhost:3000/api/test', {
        method: 'GET'
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'x-request-id': expect.any(String)
          })
        })
      );
    });

    it('should generate a valid UUID for x-request-id', async () => {
      await fetchWithTracing('http://localhost:3000/api/test');

      const callArgs = fetch.mock.calls[0][1];
      const requestId = callArgs.headers['x-request-id'];

      // UUID v4 format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(requestId).toMatch(uuidRegex);
    });

    it('should preserve existing headers while adding x-request-id', async () => {
      await fetchWithTracing('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json'
        }
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
            'Content-Type': 'application/json',
            'x-request-id': expect.any(String)
          })
        })
      );
    });

    it('should return the fetch response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers([['x-request-id', 'test-id']]),
        json: async () => ({ data: 'test' })
      };
      fetch.mockResolvedValue(mockResponse);

      const response = await fetchWithTracing('http://localhost:3000/api/test');

      expect(response).toBe(mockResponse);
    });

    it('should generate different request IDs for different requests', async () => {
      await fetchWithTracing('http://localhost:3000/api/test1');
      await fetchWithTracing('http://localhost:3000/api/test2');

      const firstRequestId = fetch.mock.calls[0][1].headers['x-request-id'];
      const secondRequestId = fetch.mock.calls[1][1].headers['x-request-id'];

      expect(firstRequestId).not.toBe(secondRequestId);
    });

    it('should use crypto.randomUUID when available', async () => {
      // Verify that crypto API is available in jsdom environment
      expect(typeof crypto).toBe('object');
      expect(typeof crypto.randomUUID).toBe('function');

      await fetchWithTracing('http://localhost:3000/api/test');

      const callArgs = fetch.mock.calls[0][1];
      const requestId = callArgs.headers['x-request-id'];

      // Should be a valid UUID v4
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(requestId).toMatch(uuidRegex);
    });
  });

  describe('Convenience Methods', () => {
    it('get should make GET request with tracing', async () => {
      await get('http://localhost:3000/api/test', {
        Authorization: 'Bearer token'
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
            'x-request-id': expect.any(String)
          })
        })
      );
    });

    it('post should make POST request with tracing and JSON body', async () => {
      const body = { title: 'Test Event', description: 'Test' };
      await post('http://localhost:3000/api/events', body, {
        Authorization: 'Bearer token'
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
            'x-request-id': expect.any(String)
          }),
          body: JSON.stringify(body)
        })
      );
    });

    it('put should make PUT request with tracing and JSON body', async () => {
      const body = { title: 'Updated Event' };
      await put('http://localhost:3000/api/events/123', body, {
        Authorization: 'Bearer token'
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/events/123',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
            'x-request-id': expect.any(String)
          }),
          body: JSON.stringify(body)
        })
      );
    });

    it('deleteRequest should make DELETE request with tracing', async () => {
      await deleteRequest('http://localhost:3000/api/events/123', {
        Authorization: 'Bearer token'
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/events/123',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
            'x-request-id': expect.any(String)
          })
        })
      );
    });
  });
});
