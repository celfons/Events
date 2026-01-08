# Code Quality and Security Improvements

## Overview
This document describes the improvements made to enhance code quality, security, and maintainability of the Events application.

## Implemented Features

### 1. Request Validation with Zod

**What was added:**
- Zod validation schemas for all API endpoints
- Validation middleware that validates request body, params, and query strings
- Standardized error responses for validation failures

**Files added:**
- `src/infrastructure/web/validation/eventSchemas.js` - Event validation schemas
- `src/infrastructure/web/validation/authSchemas.js` - Authentication validation schemas
- `src/infrastructure/web/validation/registrationSchemas.js` - Registration validation schemas
- `src/infrastructure/web/validation/userSchemas.js` - User validation schemas
- `src/infrastructure/web/middleware/validation.js` - Validation middleware

**How it works:**
```javascript
// Example: Validate event creation
router.post('/', authenticateToken, validate(eventSchema, 'body'), (req, res) => 
  eventController.createEvent(req, res)
);
```

**Error format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### 2. Structured Logging with Pino

**What was added:**
- Pino logger for structured JSON logging
- Request-id tracking (x-request-id header)
- HTTP request/response logging with pino-http
- Different log levels (info, warn, error)
- Logger per request with context

**Files added:**
- `src/infrastructure/logger/logger.js` - Logger configuration
- `src/infrastructure/web/middleware/requestId.js` - Request ID middleware

**Features:**
- Automatic request ID generation or uses existing x-request-id header
- HTTP method, URL, status code, and response time logging
- Error logging with stack traces
- JSON format for easy parsing and analysis

**Log format example:**
```json
{
  "level": "info",
  "request": {
    "id": "uuid-v4",
    "method": "POST",
    "url": "/api/events"
  },
  "response": {
    "statusCode": 201
  },
  "duration": 45
}
```

### 3. Global Error Handling

**What was added:**
- Global error handler middleware
- Standardized error response format
- Error logging with request context
- Proper HTTP status codes and error codes

**Files added:**
- `src/infrastructure/web/middleware/errorHandler.js` - Error handler middleware

**Updated files:**
- All controllers now throw errors instead of returning JSON responses
- Errors are caught by the global error handler

**Error format:**
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Event not found",
    "details": null
  }
}
```

### 4. Code Quality Tools

**What was added:**
- ESLint configuration with recommended rules
- Prettier configuration for consistent code formatting
- Pre-commit hooks with Husky
- Lint-staged for automatic linting/formatting on commit
- npm scripts for linting and formatting

**Files added:**
- `eslint.config.js` - ESLint v9 configuration
- `.prettierrc.json` - Prettier configuration
- `.prettierignore` - Files to ignore in formatting
- `.husky/pre-commit` - Pre-commit hook

**npm scripts:**
```bash
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues automatically
npm run format      # Format code with Prettier
npm run format:check # Check formatting without changing files
```

**Pre-commit hook:**
- Automatically runs ESLint and Prettier on staged files
- Prevents commits with linting errors
- Ensures consistent code style

### 5. MongoDB Atomic Operations

**Status:** Already implemented

The repository already uses atomic operations for critical operations:
- `$inc` operator for incrementing/decrementing available slots
- `findOneAndUpdate` with conditions for atomic updates
- Prevents race conditions in registration process

**Example:**
```javascript
await EventModel.findOneAndUpdate(
  { _id: eventId, availableSlots: { $gt: 0 } },
  { 
    $push: { participants: participantData },
    $inc: { availableSlots: -1 }
  },
  { new: true }
);
```

### 6. Content Security Policy (CSP)

**Status:** Already implemented via Helmet

CSP headers are configured via Helmet middleware in `src/app.js`:
- `defaultSrc: ["'self'"]` - Only load resources from same origin
- `scriptSrc`, `styleSrc`, `fontSrc` - Allow CDN resources
- `frameSrc: ["'none']` - Prevent clickjacking
- `objectSrc: ["'none']` - Block plugins
- `upgradeInsecureRequests` - Force HTTPS

## Dependencies Added

### Production Dependencies
- `zod@^4.3.5` - Schema validation
- `pino@^10.1.0` - Structured logging
- `pino-http@^11.0.0` - HTTP request logging
- `uuid@^9.0.1` - UUID generation (CommonJS compatible)

### Development Dependencies
- `eslint@^9.39.2` - JavaScript linting
- `prettier@^3.7.4` - Code formatting
- `husky@^9.1.7` - Git hooks
- `lint-staged@^16.2.7` - Run linters on staged files
- `eslint-config-prettier@^10.1.8` - Disable conflicting ESLint rules
- `pino-pretty@^9.6.2` - Pretty print logs in development
- `globals@^15.14.0` - Global variables for ESLint

## Usage Examples

### Validation

All routes now automatically validate input:

```javascript
// POST /api/events with invalid data
{
  "title": "AB", // Too short (min 3 chars)
  "email": "invalid-email" // Invalid format
}

// Response: 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "title", "message": "Title must be at least 3 characters" },
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### Error Handling

Controllers throw errors that are handled globally:

```javascript
// Before
return res.status(404).json({ error: 'Event not found' });

// After
const error = new Error('Event not found');
error.statusCode = 404;
error.code = 'NOT_FOUND';
throw error;
```

### Request Tracking

Every request gets a unique ID for tracking:

```bash
# Client sends request
curl -H "x-request-id: custom-id-123" http://localhost:3000/api/events

# Server logs with same ID
{"level":"info","request":{"id":"custom-id-123",...}}
```

## Testing

All unit tests pass:
```bash
npm test -- src/application/use-cases/__tests__/
# 12 test suites, 101 tests passed
```

Integration tests require MongoDB to be running.

## Future Enhancements

1. Add rate limiting per user (currently per IP)
2. Add request/response size limits
3. Add more detailed error codes for specific business logic errors
4. Add OpenAPI validation with generated schemas
5. Add monitoring and alerting integration
6. Add correlation ID tracking across services
7. Add structured error tracking (e.g., Sentry integration)

## Migration Notes

### Breaking Changes

None. All changes are backward compatible. The API responses now include an `error` object wrapper, but the structure is similar to before.

### Configuration

No additional environment variables required. Optional:
- `LOG_LEVEL` - Set log level (default: 'info')
- `NODE_ENV` - Set to 'production' to disable pretty printing

## Conclusion

These improvements enhance the application's:
- **Security** - Input validation prevents injection attacks
- **Observability** - Structured logging enables better monitoring
- **Maintainability** - Linting and formatting ensure consistent code
- **Reliability** - Error handling provides better error recovery
- **Developer Experience** - Pre-commit hooks catch issues early
