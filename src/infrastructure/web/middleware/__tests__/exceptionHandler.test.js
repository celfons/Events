const exceptionHandler = require('../exceptionHandler');
const {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
} = require('../../../../domain/exceptions');

describe('Exception Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      requestId: 'test-request-id',
      method: 'GET',
      path: '/test',
      user: { userId: 'test-user-id' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false
    };
    next = jest.fn();
  });

  describe('AppError handling', () => {
    it('should handle ValidationError correctly', () => {
      const error = new ValidationError('Invalid input data', { field: 'email' });

      exceptionHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: { field: 'email' },
          timestamp: expect.any(String)
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle NotFoundError correctly', () => {
      const error = new NotFoundError('Event not found');

      exceptionHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Event not found',
          timestamp: expect.any(String)
        }
      });
    });

    it('should handle UnauthorizedError correctly', () => {
      const error = new UnauthorizedError('Invalid credentials');

      exceptionHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
          timestamp: expect.any(String)
        }
      });
    });

    it('should handle ForbiddenError correctly', () => {
      const error = new ForbiddenError('Access denied');

      exceptionHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
          timestamp: expect.any(String)
        }
      });
    });

    it('should handle ConflictError correctly', () => {
      const error = new ConflictError('Resource already exists');

      exceptionHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('Non-AppError handling', () => {
    it('should handle generic JavaScript errors', () => {
      const error = new Error('Something went wrong');

      exceptionHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          timestamp: expect.any(String)
        }
      });
    });

    it('should handle TypeError', () => {
      const error = new TypeError('Cannot read property of undefined');

      exceptionHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('Edge cases', () => {
    it('should call next if headers already sent', () => {
      const error = new ValidationError('Test error');
      res.headersSent = true;

      exceptionHandler(error, req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle errors without request user', () => {
      const error = new UnauthorizedError('Authentication required');
      req.user = undefined;

      exceptionHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
    });

    it('should not include details if not provided', () => {
      const error = new ValidationError('Validation failed');

      exceptionHandler(error, req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.error).not.toHaveProperty('details');
    });
  });

  describe('Custom AppError with different status codes', () => {
    it('should handle custom AppError with custom status code', () => {
      const error = new AppError('Custom error', 418, 'CUSTOM_ERROR');

      exceptionHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(418);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'CUSTOM_ERROR',
          message: 'Custom error',
          timestamp: expect.any(String)
        }
      });
    });
  });
});
