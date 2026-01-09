const exceptionHandler = require('../exceptionHandler');
const { ErrorResponse } = require('../../dto/ErrorResponse');

// Mock logger
jest.mock('../../../logging/logger', () => ({
  error: jest.fn()
}));

const logger = require('../../../logging/logger');

describe('Exception Handler', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request object with requestId
    req = {
      requestId: 'test-request-id-123',
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1'
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      getHeader: jest.fn(),
      setHeader: jest.fn()
    };

    // Mock next function
    next = jest.fn();
  });

  it('should handle errors and include requestId in response', () => {
    const error = new Error('Test error');

    exceptionHandler(error, req, res, next);

    // Verify logger was called with correct parameters
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: error,
        requestId: 'test-request-id-123',
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1'
      }),
      'Unhandled exception'
    );

    // Verify response status was set to 500
    expect(res.status).toHaveBeenCalledWith(500);

    // Verify response includes requestId
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'test-request-id-123',
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error'
        })
      })
    );
  });

  it('should handle errors when requestId is missing', () => {
    const error = new Error('Test error');
    req.requestId = undefined;

    exceptionHandler(error, req, res, next);

    // Verify logger was called
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: error,
        requestId: undefined
      }),
      'Unhandled exception'
    );

    // Verify response includes requestId (even if undefined)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: undefined,
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error'
        })
      })
    );
  });

  it('should handle different error types', () => {
    const error = new TypeError('Type error occurred');

    exceptionHandler(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: error
      }),
      'Unhandled exception'
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });
});
