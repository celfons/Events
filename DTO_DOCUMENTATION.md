# DTOs and Standardized Response Format

## Overview
This document describes the Data Transfer Objects (DTOs) and standardized response formats implemented for the Events API.

## Error Response Format

All error responses follow a consistent structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "2026-01-08T12:46:29.155Z",
    "details": [] // Optional: additional error details
  }
}
```

### Error Codes

#### Validation Errors (400)
- `VALIDATION_ERROR` - General validation failure
- `INVALID_INPUT` - Invalid input data
- `MISSING_REQUIRED_FIELD` - Required field is missing

#### Authentication Errors (401)
- `UNAUTHORIZED` - Authentication required
- `INVALID_CREDENTIALS` - Wrong username/password
- `TOKEN_EXPIRED` - JWT token has expired
- `TOKEN_INVALID` - JWT token is invalid

#### Authorization Errors (403)
- `FORBIDDEN` - Access denied
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions

#### Not Found Errors (404)
- `NOT_FOUND` - Resource not found
- `RESOURCE_NOT_FOUND` - Specific resource not found

#### Conflict Errors (409)
- `CONFLICT` - Resource conflict
- `DUPLICATE_RESOURCE` - Resource already exists

#### Server Errors (500)
- `INTERNAL_SERVER_ERROR` - Internal server error
- `DATABASE_ERROR` - Database operation failed

### Error Response Examples

#### Validation Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "timestamp": "2026-01-08T12:46:29.155Z",
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
}
```

#### Authentication Error
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials",
    "timestamp": "2026-01-08T12:46:29.155Z"
  }
}
```

#### Not Found Error
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Event not found",
    "timestamp": "2026-01-08T12:46:29.155Z"
  }
}
```

## Success Response Format

All success responses follow a consistent structure:

```json
{
  "data": { ... },
  "message": "Optional success message",
  "meta": { ... } // Optional: metadata (pagination, etc.)
}
```

### Success Response Examples

#### Single Resource
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Tech Conference 2024",
    "description": "Annual technology conference",
    "dateTime": "2024-12-31T10:00:00Z",
    "totalSlots": 100,
    "availableSlots": 95
  },
  "message": "Resource created successfully"
}
```

#### List of Resources
```json
{
  "data": [
    { "id": "...", "title": "Event 1" },
    { "id": "...", "title": "Event 2" }
  ],
  "meta": {
    "page": 1,
    "perPage": 10,
    "total": 25
  }
}
```

#### Delete Operation
```json
{
  "data": null,
  "message": "Resource deleted successfully"
}
```

## Request DTOs

### Event Requests

#### CreateEventRequest
```javascript
{
  title: string,          // Required, max 200 chars
  description: string,    // Required
  dateTime: string,       // Required, ISO 8601 format
  totalSlots: number,     // Required, positive integer
  local: string          // Optional, max 500 chars
}
```

#### UpdateEventRequest
```javascript
{
  title: string,          // Optional, max 200 chars
  description: string,    // Optional
  dateTime: string,       // Optional, ISO 8601 format
  totalSlots: number,     // Optional, positive integer
  local: string          // Optional, max 500 chars
}
// At least one field must be provided
```

### Authentication Requests

#### LoginRequest
```javascript
{
  email: string,          // Required, valid email format
  password: string        // Required, min 6 characters
}
```

#### RegisterRequest
```javascript
{
  username: string,       // Required, max 100 chars
  email: string,          // Required, valid email format
  password: string,       // Required, min 6 characters
  role: string           // Optional, 'user' or 'superuser', defaults to 'user'
}
```

### Registration Requests

#### CreateRegistrationRequest
```javascript
{
  eventId: string,        // Required, MongoDB ObjectId
  name: string,           // Required, max 200 chars
  email: string,          // Required, valid email format
  phone: string          // Required, min 10 digits
}
```

#### CancelRegistrationRequest
```javascript
{
  eventId: string         // Required, MongoDB ObjectId
}
```

## Response DTOs

### Event Responses

#### EventResponse
```javascript
{
  id: string,
  title: string,
  description: string,
  dateTime: string,
  totalSlots: number,
  availableSlots: number,
  local: string,
  userId: string,
  isActive: boolean,
  createdAt: string
}
```

#### EventDetailsResponse (extends EventResponse)
```javascript
{
  ...EventResponse,
  participantsCount: number
}
```

### Authentication Responses

#### LoginResponse
```javascript
{
  token: string,
  user: {
    id: string,
    username: string,
    email: string,
    role: string
  }
}
```

#### UserResponse
```javascript
{
  id: string,
  username: string,
  email: string,
  role: string,
  isActive: boolean,
  createdAt: string
}
// Note: Password is never included
```

### Registration Responses

#### RegistrationResponse
```javascript
{
  id: string,
  eventId: string,
  name: string,
  email: string,
  phone: string,
  status: string,
  registeredAt: string
}
```

## Usage in Controllers

### Using ErrorResponse
```javascript
const { ErrorResponse } = require('../dto');

// Validation error
const errorResponse = ErrorResponse.validationError(details);
return res.status(errorResponse.status).json(errorResponse.toJSON());

// Not found error
const errorResponse = ErrorResponse.notFound('Event not found');
return res.status(errorResponse.status).json(errorResponse.toJSON());

// Authentication error
const errorResponse = ErrorResponse.unauthorized('Token expired');
return res.status(errorResponse.status).json(errorResponse.toJSON());

// Internal error
const errorResponse = ErrorResponse.internalError();
return res.status(errorResponse.status).json(errorResponse.toJSON());
```

### Using SuccessResponse
```javascript
const { SuccessResponse, EventResponse } = require('../dto');

// Return single resource
const event = EventResponse.fromEntity(result.data);
const successResponse = SuccessResponse.ok(event);
return res.status(200).json(successResponse.toJSON());

// Return created resource
const event = EventResponse.fromEntity(result.data);
const successResponse = SuccessResponse.created(event);
return res.status(201).json(successResponse.toJSON());

// Return list of resources
const events = EventResponse.fromEntities(result.data);
const successResponse = SuccessResponse.list(events, meta);
return res.status(200).json(successResponse.toJSON());

// Return delete confirmation
const successResponse = SuccessResponse.deleted('Event deleted successfully');
return res.status(200).json(successResponse.toJSON());
```

## Benefits

1. **Consistency**: All responses follow the same structure
2. **Error Handling**: Standardized error codes for better client-side handling
3. **Documentation**: Clear contract between frontend and backend
4. **Type Safety**: DTOs provide structure and validation
5. **Maintainability**: Centralized response formatting
6. **Debugging**: Timestamps help with error tracking
7. **Client Integration**: Predictable response format simplifies client code

## Migration from Old Format

### Before
```javascript
// Error
return res.status(400).json({ error: 'Some error' });

// Success
return res.status(200).json(result.data);
```

### After
```javascript
// Error
const errorResponse = ErrorResponse.invalidInput('Some error');
return res.status(errorResponse.status).json(errorResponse.toJSON());

// Success
const data = EventResponse.fromEntity(result.data);
const successResponse = SuccessResponse.ok(data);
return res.status(200).json(successResponse.toJSON());
```

## API Examples

### Create Event

**Request:**
```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Tech Conference 2024",
  "description": "Annual technology conference",
  "dateTime": "2024-12-31T10:00:00Z",
  "totalSlots": 100,
  "local": "Convention Center"
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Tech Conference 2024",
    "description": "Annual technology conference",
    "dateTime": "2024-12-31T10:00:00Z",
    "totalSlots": 100,
    "availableSlots": 100,
    "local": "Convention Center",
    "userId": "507f1f77bcf86cd799439012",
    "isActive": true,
    "createdAt": "2026-01-08T12:46:29.155Z"
  },
  "message": "Resource created successfully"
}
```

**Error Response (400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "timestamp": "2026-01-08T12:46:29.155Z",
    "details": [
      {
        "field": "title",
        "message": "This field cannot be empty"
      }
    ]
  }
}
```

### Login

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "username": "johndoe",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

**Error Response (401):**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials",
    "timestamp": "2026-01-08T12:46:29.155Z"
  }
}
```

### List Events

**Request:**
```http
GET /api/events
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Tech Conference 2024",
      "description": "Annual technology conference",
      "dateTime": "2024-12-31T10:00:00Z",
      "totalSlots": 100,
      "availableSlots": 95,
      "local": "Convention Center",
      "userId": "507f1f77bcf86cd799439012",
      "isActive": true,
      "createdAt": "2026-01-08T12:46:29.155Z"
    }
  ]
}
```
