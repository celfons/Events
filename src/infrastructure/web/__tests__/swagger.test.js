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

      // Base entity schemas
      expect(swaggerSpec.components.schemas.Event).toBeDefined();
      expect(swaggerSpec.components.schemas.EventDetails).toBeDefined();
      expect(swaggerSpec.components.schemas.EventInput).toBeDefined();
      expect(swaggerSpec.components.schemas.Registration).toBeDefined();
      expect(swaggerSpec.components.schemas.RegistrationInput).toBeDefined();
      expect(swaggerSpec.components.schemas.User).toBeDefined();
      expect(swaggerSpec.components.schemas.LoginResponse).toBeDefined();

      // Response wrapper schemas
      expect(swaggerSpec.components.schemas.Error).toBeDefined();
      expect(swaggerSpec.components.schemas.SuccessResponse).toBeDefined();
      expect(swaggerSpec.components.schemas.SuccessMessage).toBeDefined();
      expect(swaggerSpec.components.schemas.EventResponse).toBeDefined();
      expect(swaggerSpec.components.schemas.EventDetailsResponse).toBeDefined();
      expect(swaggerSpec.components.schemas.EventListResponse).toBeDefined();
      expect(swaggerSpec.components.schemas.RegistrationResponse).toBeDefined();
      expect(swaggerSpec.components.schemas.RegistrationListResponse).toBeDefined();
      expect(swaggerSpec.components.schemas.UserResponse).toBeDefined();
      expect(swaggerSpec.components.schemas.UserListResponse).toBeDefined();
      expect(swaggerSpec.components.schemas.LoginSuccessResponse).toBeDefined();
    });

    it('should document all event endpoints', () => {
      const swaggerSpec = require('../swagger');

      expect(swaggerSpec.paths['/api/events']).toBeDefined();
      expect(swaggerSpec.paths['/api/events'].get).toBeDefined();
      expect(swaggerSpec.paths['/api/events'].post).toBeDefined();
      expect(swaggerSpec.paths['/api/events/my-events']).toBeDefined();
      expect(swaggerSpec.paths['/api/events/my-events'].get).toBeDefined();
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

    it('should document auth endpoints', () => {
      const swaggerSpec = require('../swagger');

      expect(swaggerSpec.paths['/api/auth/login']).toBeDefined();
      expect(swaggerSpec.paths['/api/auth/login'].post).toBeDefined();
    });

    it('should document user management endpoints', () => {
      const swaggerSpec = require('../swagger');

      expect(swaggerSpec.paths['/api/users']).toBeDefined();
      expect(swaggerSpec.paths['/api/users'].get).toBeDefined();
      expect(swaggerSpec.paths['/api/users'].post).toBeDefined();
      expect(swaggerSpec.paths['/api/users/{id}']).toBeDefined();
      expect(swaggerSpec.paths['/api/users/{id}'].put).toBeDefined();
      expect(swaggerSpec.paths['/api/users/{id}'].delete).toBeDefined();
    });

    it('should have Event schema with all required fields', () => {
      const swaggerSpec = require('../swagger');
      const eventSchema = swaggerSpec.components.schemas.Event;

      expect(eventSchema.properties.id).toBeDefined();
      expect(eventSchema.properties.title).toBeDefined();
      expect(eventSchema.properties.description).toBeDefined();
      expect(eventSchema.properties.dateTime).toBeDefined();
      expect(eventSchema.properties.totalSlots).toBeDefined();
      expect(eventSchema.properties.availableSlots).toBeDefined();
      expect(eventSchema.properties.local).toBeDefined();
      expect(eventSchema.properties.userId).toBeDefined();
      expect(eventSchema.properties.isActive).toBeDefined();
      expect(eventSchema.properties.createdAt).toBeDefined();
    });

    it('should have User schema with all required fields', () => {
      const swaggerSpec = require('../swagger');
      const userSchema = swaggerSpec.components.schemas.User;

      expect(userSchema.properties.id).toBeDefined();
      expect(userSchema.properties.username).toBeDefined();
      expect(userSchema.properties.email).toBeDefined();
      expect(userSchema.properties.role).toBeDefined();
      expect(userSchema.properties.isActive).toBeDefined();
      expect(userSchema.properties.createdAt).toBeDefined();
    });

    it('should have proper Error schema structure', () => {
      const swaggerSpec = require('../swagger');
      const errorSchema = swaggerSpec.components.schemas.Error;

      expect(errorSchema.properties.error).toBeDefined();
      expect(errorSchema.properties.error.properties.code).toBeDefined();
      expect(errorSchema.properties.error.properties.message).toBeDefined();
      expect(errorSchema.properties.error.properties.timestamp).toBeDefined();
    });

    it('should have response wrapper schemas with data property', () => {
      const swaggerSpec = require('../swagger');

      // Check EventResponse has data property
      const eventResponse = swaggerSpec.components.schemas.EventResponse;
      expect(eventResponse.properties.data).toBeDefined();

      // Check EventListResponse has data array
      const eventListResponse = swaggerSpec.components.schemas.EventListResponse;
      expect(eventListResponse.properties.data).toBeDefined();
      expect(eventListResponse.properties.data.type).toBe('array');

      // Check LoginSuccessResponse has data property
      const loginResponse = swaggerSpec.components.schemas.LoginSuccessResponse;
      expect(loginResponse.properties.data).toBeDefined();
    });
  });
});
