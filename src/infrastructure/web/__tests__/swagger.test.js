const request = require('supertest');
const createApp = require('../../../app');

describe('Swagger Documentation', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api-docs', () => {
    it('should serve Swagger UI HTML page', async () => {
      const response = await request(app).get('/api-docs/');

      expect(response.status).toBe(200);
      expect(response.text).toContain('swagger');
    });
  });

  describe('Swagger Specification', () => {
    it('should have valid OpenAPI specification', () => {
      const swaggerSpec = require('../swagger');

      expect(swaggerSpec).toBeDefined();
      expect(swaggerSpec.openapi).toBe('3.0.0');
      expect(swaggerSpec.info).toBeDefined();
      expect(swaggerSpec.info.title).toBe('Events Platform API');
      expect(swaggerSpec.info.version).toBe('1.0.0');
    });

    it('should define all required schemas', () => {
      const swaggerSpec = require('../swagger');

      expect(swaggerSpec.components.schemas.Event).toBeDefined();
      expect(swaggerSpec.components.schemas.EventInput).toBeDefined();
      expect(swaggerSpec.components.schemas.Registration).toBeDefined();
      expect(swaggerSpec.components.schemas.RegistrationInput).toBeDefined();
      expect(swaggerSpec.components.schemas.Error).toBeDefined();
      expect(swaggerSpec.components.schemas.SuccessMessage).toBeDefined();
    });

    it('should document all event endpoints', () => {
      const swaggerSpec = require('../swagger');

      expect(swaggerSpec.paths['/api/events']).toBeDefined();
      expect(swaggerSpec.paths['/api/events'].get).toBeDefined();
      expect(swaggerSpec.paths['/api/events'].post).toBeDefined();
      expect(swaggerSpec.paths['/api/events/{id}']).toBeDefined();
      expect(swaggerSpec.paths['/api/events/{id}'].get).toBeDefined();
      expect(swaggerSpec.paths['/api/events/{id}'].put).toBeDefined();
      expect(swaggerSpec.paths['/api/events/{id}'].delete).toBeDefined();
      expect(swaggerSpec.paths['/api/events/{id}/participants']).toBeDefined();
      expect(swaggerSpec.paths['/api/events/{id}/participants'].get).toBeDefined();
    });

    it('should document all registration endpoints', () => {
      const swaggerSpec = require('../swagger');

      expect(swaggerSpec.paths['/api/registrations']).toBeDefined();
      expect(swaggerSpec.paths['/api/registrations'].post).toBeDefined();
      expect(swaggerSpec.paths['/api/registrations/{id}/cancel']).toBeDefined();
      expect(swaggerSpec.paths['/api/registrations/{id}/cancel'].post).toBeDefined();
    });
  });
});
