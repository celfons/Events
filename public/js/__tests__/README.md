# UI Tests Documentation

## Overview

This project includes comprehensive UI tests for the frontend JavaScript code using Jest and JSDOM. These tests ensure that changes to the UI don't break the contract with the API and that DOM manipulations work correctly.

## Test Structure

All UI tests are located in the `public/js/__tests__/` directory:

```
public/js/__tests__/
├── admin.test.js           # Tests for admin panel (event management)
├── auth-utils.test.js      # Tests for authentication utilities
├── event-details.test.js   # Tests for event details page
├── index.test.js           # Tests for main events listing page
└── test-helper.js          # Shared test utilities and mocks
```

## Running the Tests

```bash
# Run all tests (including UI tests)
npm test

# Run only UI tests
npm test -- public/js/__tests__

# Run a specific UI test file
npm test -- public/js/__tests__/auth-utils.test.js

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

### auth-utils.test.js
Tests the authentication utility functions:
- ✅ Token management (save, retrieve, clear)
- ✅ Token expiration validation
- ✅ User data storage and retrieval
- ✅ Superuser role checking
- ✅ localStorage interactions

### index.test.js
Tests the main events listing page:
- ✅ DOM element existence and structure
- ✅ API contract for `/api/events` endpoint
- ✅ Authentication endpoints contract
- ✅ Event card data structure
- ✅ HTML sanitization for XSS prevention
- ✅ CSS classes for UI states
- ✅ Pagination configuration
- ✅ Search functionality
- ✅ Date formatting
- ✅ Slot availability display logic

### event-details.test.js
Tests the event details and registration page:
- ✅ DOM element existence
- ✅ API contract for event details endpoint
- ✅ API contract for registration endpoint
- ✅ API contract for cancellation endpoint
- ✅ Registration data structure
- ✅ Storage key generation and sanitization
- ✅ Event ID extraction from URL
- ✅ Error handling (404, network errors)
- ✅ localStorage error handling
- ✅ Form validation

### admin.test.js
Tests the admin panel functionality:
- ✅ DOM element existence
- ✅ API contract for event management (CRUD operations)
- ✅ API contract for participants endpoint
- ✅ Authentication headers (Bearer token)
- ✅ Authentication check before access
- ✅ Pagination configuration
- ✅ Event status filtering
- ✅ User role checking (superuser)
- ✅ Error handling (401 unauthorized)
- ✅ Form validation for event creation

## Test Philosophy

### 1. API Contract Testing
The tests focus on ensuring the **contract with the API is not broken**:
- Endpoint URLs are correct
- Request methods (GET, POST, PUT, DELETE) are appropriate
- Request headers include proper authentication
- Request body structure matches API expectations
- Response data structure is validated

Example:
```javascript
it('should expect events data in response.data format', async () => {
  const mockResponse = {
    data: [
      {
        id: '1',
        title: 'Test Event',
        // ... other fields
      }
    ]
  };
  
  // Validate the contract
  expect(data).toHaveProperty('data');
  expect(Array.isArray(data.data)).toBe(true);
});
```

### 2. DOM Structure Testing
Tests validate that expected DOM elements exist and can be manipulated:
- Required elements are present
- Elements have correct IDs
- Form inputs have appropriate types
- CSS classes are applied correctly

### 3. Security Testing
Tests ensure security measures are in place:
- HTML is escaped to prevent XSS attacks
- Storage keys are sanitized
- Authentication tokens are validated
- Error handling doesn't expose sensitive data

## Configuration

### Jest Configuration
The project uses separate test environments based on the test type:

```json
{
  "jest": {
    "testEnvironment": "node",  // Default for backend tests
    "transformIgnorePatterns": [
      "node_modules/(?!(@exodus/bytes)/)"  // Allow ESM modules
    ]
  }
}
```

UI tests override the environment using:
```javascript
/**
 * @jest-environment jsdom
 */
```

### Dependencies
- `jest` - Test framework
- `jest-environment-jsdom` - JSDOM environment for Jest
- `jsdom` - JavaScript implementation of web standards for Node.js

## Best Practices

### 1. Test Isolation
Each test is isolated with proper setup and teardown:
```javascript
beforeEach(() => {
  document.body.innerHTML = '...'; // Clean DOM
  jest.clearAllMocks();            // Clear mock history
  localStorage.clear();             // Clear storage
});
```

### 2. Mock External Dependencies
All external dependencies are mocked:
- `fetch` - API calls
- `localStorage` - Browser storage
- `alert`, `confirm` - User dialogs
- `bootstrap` - UI framework

### 3. Focus on Contracts, Not Implementation
Tests validate **what** the code does, not **how** it does it:
- ✅ "Should call /api/events endpoint"
- ❌ "Should use fetch with specific implementation details"

### 4. Readable Test Names
Test descriptions clearly state what is being tested:
```javascript
describe('API Contract - Events Endpoint', () => {
  it('should define correct API endpoint structure for loading events', () => {
    // ...
  });
});
```

## Troubleshooting

### ESM Module Issues
If you encounter errors with ESM modules, ensure `transformIgnorePatterns` in `package.json` is configured correctly.

### JSDOM Environment
UI tests must include the JSDOM environment directive:
```javascript
/**
 * @jest-environment jsdom
 */
```

### Integration Test Timeouts
Integration tests may timeout due to MongoDB connection issues. Run UI tests separately:
```bash
npm test -- public/js/__tests__
```

## Adding New UI Tests

When adding new JavaScript files to the frontend:

1. Create a corresponding test file in `public/js/__tests__/`
2. Add the JSDOM environment directive
3. Test the API contract
4. Test DOM element existence
5. Test security (sanitization, validation)
6. Run the tests: `npm test -- public/js/__tests__/yourfile.test.js`

Example structure:
```javascript
/**
 * @jest-environment jsdom
 */

describe('yourfile.js - UI Tests', () => {
  beforeEach(() => {
    // Setup
  });

  describe('API Contract', () => {
    it('should use correct endpoint', () => {
      // Test
    });
  });

  describe('DOM Elements', () => {
    it('should have required elements', () => {
      // Test
    });
  });
});
```

## Benefits

1. **Prevent Regressions**: Catch breaking changes early
2. **API Contract Validation**: Ensure frontend and backend stay in sync
3. **Security**: Validate sanitization and security measures
4. **Documentation**: Tests serve as living documentation
5. **Confidence**: Refactor with confidence knowing tests will catch issues

## Statistics

- **Total UI Tests**: 72
- **Test Suites**: 4
- **Coverage**: Auth utils, Events page, Event details, Admin panel
- **Execution Time**: ~1.2 seconds
