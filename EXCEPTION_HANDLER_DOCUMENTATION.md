# Exception Handler Implementation - Technical Documentation

## Overview

This document describes the centralized exception handler implementation for the Events API. The solution eliminates repetitive try-catch blocks across controllers and provides consistent error responses to API clients.

## Architecture

### 1. Domain Exceptions (`src/domain/exceptions/`)

Custom exception classes that represent different error scenarios:

- **AppError** - Base exception class that all custom errors extend
- **ValidationError** (400) - Used for input validation failures
- **UnauthorizedError** (401) - Used for authentication failures
- **ForbiddenError** (403) - Used for authorization failures
- **NotFoundError** (404) - Used when resources are not found
- **ConflictError** (409) - Used for resource conflicts (e.g., duplicates)

Each exception includes:
- HTTP status code
- Error code for client identification
- Human-readable message
- Optional details object (e.g., validation errors)

### 2. Exception Handler Middleware (`src/infrastructure/web/middleware/exceptionHandler.js`)

The centralized middleware that:
- Catches all errors thrown in the application
- Differentiates between operational errors (AppError) and programming errors
- Logs errors appropriately (warnings for operational, errors for programming)
- Returns consistent JSON error responses
- Prevents duplicate responses if headers already sent

**Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "details": { "field": "email" },
    "timestamp": "2026-01-08T19:00:00.000Z"
  }
}
```

The `x-request-id` header is also included in the HTTP response headers for correlation with server logs.

### 3. Async Handler Wrapper (`src/infrastructure/web/middleware/asyncHandler.js`)

A utility that wraps async route handlers to automatically catch errors and pass them to the exception handler. This eliminates the need for try-catch blocks in every controller method.

**Before (with try-catch):**
```javascript
async login(req, res) {
  try {
    const result = await this.loginUseCase.execute(email, password);
    if (!result.success) {
      const errorResponse = ErrorResponse.invalidCredentials(result.error);
      return res.status(errorResponse.status).json(errorResponse.toJSON());
    }
    // ... success handling
  } catch (error) {
    const errorResponse = ErrorResponse.internalError();
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }
}
```

**After (with exception handler):**
```javascript
async login(req, res) {
  const { email, password } = req.body;
  const result = await this.loginUseCase.execute(email, password);
  
  if (!result.success) {
    throw new UnauthorizedError(result.error);
  }
  
  const loginResponse = LoginResponse.fromData(result.data);
  const successResponse = SuccessResponse.ok(loginResponse);
  return res.status(200).json(successResponse.toJSON());
}

// Method is wrapped with asyncHandler
AuthController.prototype.login = asyncHandler(AuthController.prototype.login);
```

## Benefits

1. **Code Reduction**: Eliminated ~233 lines of repetitive error handling code
2. **Consistency**: All errors return the same JSON structure
3. **Centralized Logging**: All errors are logged in one place with proper context
4. **Request Correlation**: Every error response includes `requestId` in both the response body and `x-request-id` header for easy correlation with server logs
5. **Type Safety**: Using specific exception classes makes error handling more explicit
6. **Maintainability**: Error handling logic is in one place, easier to update
7. **Testability**: Centralized exception handler can be thoroughly unit tested

## Integration

The exception handler is registered as the last middleware in `app.js`:

```javascript
// All routes defined above...

// Centralized error handler (must be last middleware)
app.use(exceptionHandler);
```

## Testing

Comprehensive unit tests are located in:
- `src/infrastructure/web/middleware/__tests__/exceptionHandler.test.js` (13 tests)
- `src/infrastructure/web/middleware/__tests__/asyncHandler.test.js` (3 tests)

All tests verify that:
- Error responses include the correct status codes
- The `x-request-id` header is set in responses
- The `requestId` field is included in error response bodies
- All error types are handled correctly

All 192 unit tests pass successfully, including the new exception handler tests.

## Usage Examples

### Throwing a Validation Error
```javascript
if (!email || !email.includes('@')) {
  throw new ValidationError('Invalid email format', { field: 'email' });
}
```

### Throwing a Not Found Error
```javascript
const event = await eventRepository.findById(id);
if (!event) {
  throw new NotFoundError(`Event with ID ${id} not found`);
}
```

### Throwing an Unauthorized Error
```javascript
if (!isValidPassword) {
  throw new UnauthorizedError('Invalid credentials');
}
```

## HTTP Status Codes Mapping

| Exception Class      | HTTP Status | Error Code              |
|---------------------|-------------|-------------------------|
| ValidationError     | 400         | VALIDATION_ERROR        |
| UnauthorizedError   | 401         | UNAUTHORIZED            |
| ForbiddenError      | 403         | FORBIDDEN               |
| NotFoundError       | 404         | NOT_FOUND               |
| ConflictError       | 409         | CONFLICT                |
| Generic Error       | 500         | INTERNAL_SERVER_ERROR   |

## Files Modified

### Created Files:
- `src/domain/exceptions/AppError.js`
- `src/domain/exceptions/ValidationError.js`
- `src/domain/exceptions/NotFoundError.js`
- `src/domain/exceptions/UnauthorizedError.js`
- `src/domain/exceptions/ForbiddenError.js`
- `src/domain/exceptions/ConflictError.js`
- `src/domain/exceptions/index.js`
- `src/infrastructure/web/middleware/exceptionHandler.js`
- `src/infrastructure/web/middleware/asyncHandler.js`
- `src/infrastructure/web/middleware/__tests__/exceptionHandler.test.js`
- `src/infrastructure/web/middleware/__tests__/asyncHandler.test.js`

### Modified Files:
- `src/app.js` - Integrated exception handler middleware
- `src/infrastructure/web/controllers/AuthController.js` - Refactored to use exceptions
- `src/infrastructure/web/controllers/EventController.js` - Refactored to use exceptions
- `src/infrastructure/web/controllers/UserController.js` - Refactored to use exceptions
- `src/infrastructure/web/controllers/RegistrationController.js` - Refactored to use exceptions

## Backward Compatibility

The exception handler maintains backward compatibility with existing error response format from `ErrorResponse` DTO. API clients will receive the same error structure as before.

## Future Enhancements

Potential improvements for future iterations:
1. Add error monitoring/alerting integration (e.g., Sentry)
2. Add request/response correlation IDs to error logs
3. Implement error rate limiting for specific error types
4. Add internationalization support for error messages
5. Create custom errors for database-specific issues
