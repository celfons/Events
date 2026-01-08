const { z } = require('zod');
const validate = require('../validate');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('Body Validation', () => {
    it('should pass validation with valid body', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
      });

      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const middleware = validate({ body: schema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid email', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
      });

      req.body = {
        email: 'invalid-email',
        password: 'password123'
      };

      const middleware = validate({ body: schema });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: expect.any(String),
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: expect.stringContaining('email')
            })
          ])
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation with missing required fields', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
      });

      req.body = {
        email: 'test@example.com'
        // missing password
      };

      const middleware = validate({ body: schema });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: expect.any(String),
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'password'
            })
          ])
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation with password too short', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
      });

      req.body = {
        email: 'test@example.com',
        password: '123'
      };

      const middleware = validate({ body: schema });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: expect.any(String),
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'password'
            })
          ])
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Params Validation', () => {
    it('should pass validation with valid MongoDB ObjectId', async () => {
      const schema = z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/)
      });

      req.params = {
        id: '507f1f77bcf86cd799439011'
      };

      const middleware = validate({ params: schema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid MongoDB ObjectId', async () => {
      const schema = z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid ID format' })
      });

      req.params = {
        id: 'invalid-id'
      };

      const middleware = validate({ params: schema });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: expect.any(String),
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'id',
              message: 'Invalid ID format'
            })
          ])
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Query Validation', () => {
    it('should pass validation with valid query parameters', async () => {
      const schema = z.object({
        page: z.string().regex(/^\d+$/).transform(Number),
        limit: z.string().regex(/^\d+$/).transform(Number)
      });

      req.query = {
        page: '1',
        limit: '10'
      };

      const middleware = validate({ query: schema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.query.page).toBe(1);
      expect(req.query.limit).toBe(10);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Validations', () => {
    it('should validate body and params together', async () => {
      const schemas = {
        body: z.object({
          title: z.string().min(1)
        }),
        params: z.object({
          id: z.string().regex(/^[0-9a-fA-F]{24}$/)
        })
      };

      req.body = { title: 'Test Event' };
      req.params = { id: '507f1f77bcf86cd799439011' };

      const middleware = validate(schemas);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail if either body or params is invalid', async () => {
      const schemas = {
        body: z.object({
          title: z.string().min(1)
        }),
        params: z.object({
          id: z.string().regex(/^[0-9a-fA-F]{24}$/)
        })
      };

      req.body = { title: 'Test Event' };
      req.params = { id: 'invalid-id' };

      const middleware = validate(schemas);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Optional Fields', () => {
    it('should pass validation with optional fields present', async () => {
      const schema = z.object({
        title: z.string().min(1),
        description: z.string().optional()
      });

      req.body = {
        title: 'Test',
        description: 'Test description'
      };

      const middleware = validate({ body: schema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should pass validation with optional fields missing', async () => {
      const schema = z.object({
        title: z.string().min(1),
        description: z.string().optional()
      });

      req.body = {
        title: 'Test'
      };

      const middleware = validate({ body: schema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should format multiple validation errors', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        username: z.string().min(3)
      });

      req.body = {
        email: 'invalid',
        password: '12',
        username: 'ab'
      };

      const middleware = validate({ body: schema });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: expect.any(String),
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'password' }),
            expect.objectContaining({ field: 'username' })
          ])
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('No Schema Provided', () => {
    it('should pass through when no schemas are provided', async () => {
      const middleware = validate({});
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
