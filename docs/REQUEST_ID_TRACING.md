# Request ID Tracing Implementation

## Overview

This document describes the distributed tracing implementation using request IDs across the React frontend and Node.js backend.

## Problem

The application was experiencing issues with event creation and updates returning 400 errors. The backend had distributed logging middleware and an interceptor system to track requests, but the frontend was not sending the required `x-request-id` header. This broke the distributed tracing chain, making it difficult to correlate frontend requests with backend logs for debugging.

## Solution

### Backend Implementation

The backend already had the following components in place:

1. **Request ID Middleware** (`src/infrastructure/logging/requestIdMiddleware.js`)
   - Generates or extracts `x-request-id` from request headers
   - Adds the request ID to both the request object and response headers
   - Uses UUID v4 format for unique identification

2. **Request Logger** (`src/infrastructure/logging/requestLogger.js`)
   - Uses pino-http for structured logging
   - Logs all incoming requests with the request ID
   - Includes custom log levels based on response status codes

3. **Exception Handler** (`src/infrastructure/web/middleware/exceptionHandler.js`)
   - Includes request ID in error responses
   - Ensures correlation between errors and original requests

### Frontend Implementation

We added a new API client utility to the React frontend:

1. **API Client** (`src-react/utils/apiClient.js`)
   - Wraps the native `fetch` API
   - Automatically generates cryptographically secure UUID v4 request IDs for each request using `crypto.randomUUID()` or `crypto.getRandomValues()`
   - Adds `x-request-id` header to all outgoing requests
   - Provides convenience methods: `get()`, `post()`, `put()`, `delete()`

2. **Integration**
   - Updated all React pages to use `fetchWithTracing` instead of native `fetch`
   - Modified pages: `Index.jsx`, `Admin.jsx`, `EventDetails.jsx`, `Users.jsx`
   - Updated hooks: `useAuth.js`
   - Updated context: `AppContext.jsx`

### Request ID Flow

```
┌─────────────────┐
│  React Client   │
│                 │
│  Generate UUID  │
│  x-request-id   │
└────────┬────────┘
         │
         │ HTTP Request with
         │ x-request-id header
         ▼
┌─────────────────┐
│  Express Server │
│                 │
│  requestIdMidd. │◄── Receives x-request-id
│                 │    or generates new one
└────────┬────────┘
         │
         │ Pass request ID
         │ through middleware chain
         ▼
┌─────────────────┐
│  Request Logger │◄── Logs request with ID
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Controllers &  │
│  Use Cases      │
└────────┬────────┘
         │
         │ Response with
         │ x-request-id header
         ▼
┌─────────────────┐
│  React Client   │
│  (receives ID)  │
└─────────────────┘
```

## Benefits

1. **End-to-End Tracing**: Complete visibility of requests from client to server
2. **Error Correlation**: Easy identification of which client request caused a server error
3. **Debugging**: Simplified debugging with unique identifiers for each request
4. **Monitoring**: Better observability for distributed systems
5. **Log Analysis**: Ability to group related log entries by request ID
6. **Security**: Cryptographically secure UUID generation using Web Crypto API prevents predictability

## Usage

### Frontend

```javascript
import { fetchWithTracing, post, get, put, deleteRequest } from '../utils/apiClient';

// Using the wrapper directly
const response = await fetchWithTracing('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// Using convenience methods
const response = await post('/api/events', data, { Authorization: 'Bearer token' });
const response = await get('/api/events', { Authorization: 'Bearer token' });
const response = await put('/api/events/123', data, { Authorization: 'Bearer token' });
const response = await deleteRequest('/api/events/123', { Authorization: 'Bearer token' });
```

### Backend Logs

Logs will now include the request ID for correlation:

```json
{
  "level": "info",
  "time": "2026-01-11T13:00:00.000Z",
  "request": {
    "id": 1,
    "method": "POST",
    "url": "/api/events",
    "headers": {
      "x-request-id": "12345678-1234-4234-b234-123456789012"
    }
  },
  "response": {
    "statusCode": 201
  },
  "duration": 45,
  "msg": "POST /api/events 201"
}
```

Error responses also include the request ID:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [...]
  },
  "requestId": "12345678-1234-4234-b234-123456789012"
}
```

## Testing

Integration tests are available in `src/infrastructure/logging/__tests__/requestIdTracing.test.js` to verify:

- Request ID generation when not provided
- Request ID propagation when provided by client
- Request ID inclusion in error responses
- Request ID logging throughout the request lifecycle
- Unique request IDs for concurrent requests

Run tests with:
```bash
npm test -- src/infrastructure/logging/__tests__/requestIdTracing.test.js
```

## Future Enhancements

1. **Request ID Persistence**: Store request IDs in a database for long-term tracing
2. **Distributed Tracing Systems**: Integration with tools like Jaeger or Zipkin
3. **Parent-Child Relationships**: Track request chains for microservices
4. **Performance Metrics**: Correlate request IDs with performance data
5. **Alert Integration**: Use request IDs in alerting systems for better incident response
