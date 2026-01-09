const asyncHandler = require('../asyncHandler');

describe('Async Handler', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
  });

  it('should call the async function and resolve successfully', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const handler = asyncHandler(mockFn);

    await handler(req, res, next);

    expect(mockFn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should catch errors from async function and pass to next', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const handler = asyncHandler(mockFn);

    await handler(req, res, next);

    expect(mockFn).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
