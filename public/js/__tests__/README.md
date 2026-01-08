# Tests for Public JavaScript Files

This directory contains Jest + JSDOM tests for the frontend JavaScript files in the `public/js/` directory. These tests ensure that the frontend code correctly interacts with the API and the DOM.

## Test Files

### `auth-utils.test.js`
Tests for authentication utilities (`auth-utils.js`):
- Token management (saveToken, getToken, clearAuthData)
- Token expiration validation
- User role checks (isSuperuser, isTokenValid)
- User data retrieval

**Coverage**: 17 tests

### `index.test.js`
Tests for main page functionality (`index.js`):
- Authentication UI updates
- Login API integration
- Event loading and filtering
- Event card creation
- Pagination logic
- HTML escaping for security

**Coverage**: 11 tests

### `api-contracts.test.js`
Tests for API contract validation:
- Events API (`GET /api/events`)
- Authentication API (`POST /api/auth/login`)
- Registration API (`POST /api/registrations`)
- Error handling (network errors, malformed responses)
- DOM updates after API calls

**Coverage**: 10 tests

## Running Tests

Run all public JS tests:
```bash
npm test -- public/js/__tests__/
```

Run a specific test file:
```bash
npm test -- public/js/__tests__/auth-utils.test.js
npm test -- public/js/__tests__/index.test.js
npm test -- public/js/__tests__/api-contracts.test.js
```

Run tests in watch mode:
```bash
npm test -- --watch public/js/__tests__/
```

## Test Environment

The tests use:
- **Jest**: JavaScript testing framework
- **JSDOM**: JavaScript implementation of web standards for DOM manipulation
- **jest-environment-jsdom**: Jest environment for browser-like testing

## Key Testing Patterns

### Mocking fetch API
```javascript
global.fetch = jest.fn();
global.fetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: [] })
});
```

### Mocking localStorage
```javascript
localStorage.setItem('token', 'test-token');
expect(localStorage.getItem('token')).toBe('test-token');
```

### Testing DOM manipulation
```javascript
document.body.innerHTML = `<div id="test"></div>`;
// ... test code that manipulates DOM
expect(document.getElementById('test').textContent).toBe('expected');
```

### Testing API contracts
```javascript
await login('test@example.com', 'password');
expect(global.fetch).toHaveBeenCalledWith(
  'http://localhost:3000/api/auth/login',
  expect.objectContaining({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
);
```

## Adding New Tests

When adding new tests:

1. Create a new test file in `public/js/__tests__/`
2. Use the `@jest-environment jsdom` comment at the top
3. Mock global objects (fetch, localStorage, etc.) as needed
4. Set up DOM structure in `beforeEach`
5. Clean up mocks in `afterEach`

Example:
```javascript
/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost:3000"}
 */

describe('My Feature', () => {
  beforeEach(() => {
    global.fetch.mockClear();
    localStorage.clear();
    document.body.innerHTML = `<!-- your DOM structure -->`;
  });

  it('should do something', () => {
    // your test
  });
});
```

## Test Coverage

Current coverage: **38 tests passing**

The tests cover:
- ✅ Authentication and authorization
- ✅ API request/response handling
- ✅ DOM manipulation
- ✅ Error handling
- ✅ Data validation
- ✅ Security (XSS prevention via escapeHtml)
- ✅ LocalStorage persistence

## Continuous Integration

These tests run automatically on:
- Every commit
- Pull request creation
- Before merging to main branch

## Troubleshooting

### Window.location mocking issues
JSDOM has limitations with `window.location`. Use `@jest-environment-options` to set the URL:
```javascript
/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost:3000"}
 */
```

### Async test failures
Make sure to use `async/await` or return promises:
```javascript
it('should load data', async () => {
  await loadData();
  expect(/* assertion */);
});
```

### DOM not available
Ensure you're using the jsdom environment:
```javascript
/**
 * @jest-environment jsdom
 */
```
