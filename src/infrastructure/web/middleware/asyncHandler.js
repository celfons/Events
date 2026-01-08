/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass them to the error handler
 * This eliminates the need for try-catch blocks in every controller method
 *
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function that catches errors
 *
 * @example
 * router.get('/events', asyncHandler(async (req, res) => {
 *   const events = await eventService.getAll();
 *   res.json(events);
 * }));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
