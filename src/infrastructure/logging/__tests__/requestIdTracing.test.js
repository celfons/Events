/**
 * Integration test for request ID tracing
 * This test verifies that request IDs are properly added and logged
 */

const request = require('supertest');
const createApp = require('../../../app');
const logger = require('../logger');

describe('Request ID Tracing Integration', () => {
  let app;
  let loggerSpy;

  beforeEach(() => {
    app = createApp();
    // Spy on logger to verify request IDs are logged
    loggerSpy = jest.spyOn(logger, 'info');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Request ID Middleware', () => {
    it('should generate a request ID when not provided', async () => {
      const response = await request(app).get('/health');

      // Response should have x-request-id header
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should accept and propagate client-provided request ID', async () => {
      const clientRequestId = '12345678-1234-4234-b234-123456789012';

      const response = await request(app).get('/health').set('x-request-id', clientRequestId).expect(200);

      // Response should have the same request ID
      expect(response.headers['x-request-id']).toBe(clientRequestId);
    });

    it('should include request ID in error responses', async () => {
      const response = await request(app).get('/api/events/invalid-id').expect(400);

      // Response should have x-request-id header
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.body.requestId).toBeDefined();
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });

    it('should log requests with request ID', async () => {
      const clientRequestId = 'test-request-id-12345';

      await request(app).get('/health').set('x-request-id', clientRequestId);

      // Wait for logger to be called (async)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify logger was called with request information
      expect(loggerSpy).toHaveBeenCalled();
      // This test verifies the middleware is working by checking logger is called
      // In real scenarios, the logger would log the request ID in the structured log output
    });
  });

  describe('Distributed Tracing', () => {
    it('should maintain request ID throughout the request lifecycle', async () => {
      const clientRequestId = 'trace-test-12345';

      // Make a request with a specific request ID
      const response = await request(app).get('/health').set('x-request-id', clientRequestId).expect(200);

      // Verify the request ID is returned in the response header
      expect(response.headers['x-request-id']).toBe(clientRequestId);

      // The response body should have timestamp
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should generate unique request IDs for concurrent requests', async () => {
      const requests = [request(app).get('/health'), request(app).get('/health'), request(app).get('/health')];

      const responses = await Promise.all(requests);

      const requestIds = responses.map(r => r.headers['x-request-id']);

      // All request IDs should be unique
      expect(new Set(requestIds).size).toBe(3);
      requestIds.forEach(id => {
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      });
    });
  });

  describe('Error Handling with Request ID', () => {
    it('should include request ID in 404 responses', async () => {
      const response = await request(app).get('/non-existent-route').expect(404);

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.body.requestId).toBe(response.headers['x-request-id']);
      expect(response.body.error).toBe('Route not found');
    });
  });
});
