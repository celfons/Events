const asyncHandler = require('../asyncHandler');

describe('Async Handler Wrapper', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  it('should call the async function and resolve successfully', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const wrappedFn = asyncHandler(fn);

    await wrappedFn(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should catch errors and pass them to next', async () => {
    const error = new Error('Test error');
    const fn = jest.fn().mockRejectedValue(error);
    const wrappedFn = asyncHandler(fn);

    await wrappedFn(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should pass through the return value of the async function', async () => {
    const expectedValue = { data: 'test' };
    const fn = jest.fn(async () => {
      res.status(200).json(expectedValue);
      return expectedValue;
    });
    const wrappedFn = asyncHandler(fn);

    await wrappedFn(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedValue);
  });
});
