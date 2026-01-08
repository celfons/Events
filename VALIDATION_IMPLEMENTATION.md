# Validation Middleware Implementation Summary

## Overview
This document describes the implementation of schema-based validation using Zod for all API endpoints in the Events platform.

## What Was Added

### 1. Validation Middleware (`src/infrastructure/web/middleware/validate.js`)
- Reusable middleware factory that validates request data against Zod schemas
- Supports validation of:
  - Request body (`req.body`)
  - URL parameters (`req.params`)
  - Query parameters (`req.query`)
- Returns standardized 400 error responses with detailed validation error messages
- Example usage:
  ```javascript
  router.post('/', validate({ body: createEventSchema }), controller.method);
  ```

### 2. Validation Schemas

#### Common Schemas (`src/infrastructure/web/validation/commonSchemas.js`)
- `mongoIdSchema`: Validates MongoDB ObjectId format (24 character hex string)
- `emailSchema`: Validates email format
- `dateTimeSchema`: Validates ISO 8601 datetime format
- `phoneSchema`: Validates phone numbers (minimum 10 digits)
- `passwordSchema`: Validates passwords (minimum 6 characters)
- `nonEmptyStringSchema`: Validates non-empty strings

#### Event Schemas (`src/infrastructure/web/validation/eventSchemas.js`)
- `createEventSchema`: Validates event creation requests
  - Required: title, description, dateTime, totalSlots
  - Optional: local (location)
  - Constraints: title max 200 chars, local max 500 chars, totalSlots must be positive integer
- `updateEventSchema`: Validates event update requests
  - All fields optional, but at least one must be provided
- `eventIdParamSchema`: Validates event ID in URL parameters

#### Registration Schemas (`src/infrastructure/web/validation/registrationSchemas.js`)
- `createRegistrationSchema`: Validates registration creation
  - Required: eventId, name, email, phone
  - Validates email format and phone number
- `cancelRegistrationSchema`: Validates registration cancellation
  - Required: eventId
- `registrationIdParamSchema`: Validates registration ID in URL parameters

#### Authentication Schemas (`src/infrastructure/web/validation/authSchemas.js`)
- `loginSchema`: Validates login requests
  - Required: email, password
  - Validates email format and password length

#### User Schemas (`src/infrastructure/web/validation/userSchemas.js`)
- `createUserSchema`: Validates user creation
  - Required: username, email, password
  - Optional: role (defaults to 'user')
- `updateUserSchema`: Validates user updates
  - All fields optional, but at least one must be provided
- `userIdParamSchema`: Validates user ID in URL parameters

### 3. Route Updates
All route files have been updated to use the validation middleware:
- `src/infrastructure/web/routes/eventRoutes.js`
- `src/infrastructure/web/routes/registrationRoutes.js`
- `src/infrastructure/web/routes/authRoutes.js`
- `src/infrastructure/web/routes/userRoutes.js`

Example transformation:
```javascript
// Before
router.post('/login', (req, res) => authController.login(req, res));

// After
router.post(
  '/login',
  validate({ body: loginSchema }),
  (req, res) => authController.login(req, res)
);
```

### 4. Tests
Comprehensive unit tests were added:
- `src/infrastructure/web/middleware/__tests__/validate.test.js`: Tests for validation middleware
- `src/infrastructure/web/validation/__tests__/eventSchemas.test.js`: Tests for event validation schemas

## Benefits

1. **Early Validation**: Requests are validated before reaching controllers, reducing unnecessary processing
2. **Type Safety**: Ensures data types and formats are correct before business logic execution
3. **Consistent Error Responses**: Standardized 400 error responses with detailed validation information
4. **Code Reusability**: Schemas can be reused and composed
5. **Maintainability**: Validation logic is centralized and easy to update
6. **Security**: Prevents injection attacks by validating input formats
7. **Documentation**: Schemas serve as documentation for API requirements

## Error Response Format

When validation fails, the middleware returns a 400 status with the following format:

```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "String must contain at least 6 character(s)"
    }
  ]
}
```

## Breaking Changes

### Status Code Changes
Some endpoints now return **400 Bad Request** instead of **401 Unauthorized** for validation errors:

**Before**: Missing email/password in login → 401
**After**: Missing email/password in login → 400

This is more semantically correct as 401 should be reserved for authentication failures, not validation failures.

### Integration Tests Updated
- `src/__tests__/integration/auth.test.js`: Updated tests to expect 400 for missing credentials

## Usage Examples

### Creating an Event
```javascript
POST /api/events
Headers: { Authorization: 'Bearer <token>' }
Body: {
  "title": "Tech Conference 2024",
  "description": "Annual technology conference",
  "dateTime": "2024-12-31T10:00:00Z",
  "totalSlots": 100,
  "local": "Convention Center"  // Optional
}

// Validation automatically checks:
// - title is not empty and ≤ 200 chars
// - description is not empty
// - dateTime is valid ISO 8601 format
// - totalSlots is a positive integer
// - local (if provided) is ≤ 500 chars
```

### Login
```javascript
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}

// Validation automatically checks:
// - email is valid email format
// - password is at least 6 characters
```

### Get Event by ID
```javascript
GET /api/events/507f1f77bcf86cd799439011

// Validation automatically checks:
// - ID is valid MongoDB ObjectId format (24 hex characters)
```

## Dependencies Added
- `zod`: ^4.3.5 (schema validation library)

## Future Enhancements
- Add more specific validation rules based on business requirements
- Add custom error messages for better user experience
- Consider adding validation for query parameters (pagination, filtering)
- Add sanitization for string inputs to prevent XSS attacks
