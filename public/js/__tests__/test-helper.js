// Test helper utilities for UI tests

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

global.localStorage = localStorageMock;

// Mock bootstrap Modal
global.bootstrap = {
  Modal: jest.fn().mockImplementation(() => ({
    show: jest.fn(),
    hide: jest.fn()
  })),
  Modal.getInstance: jest.fn()
};

// Reset mocks before each test
beforeEach(() => {
  localStorage.clear();
  fetch.mockClear();
  document.body.innerHTML = '';
});

// Helper to load HTML fixture
function loadHTML(htmlString) {
  document.body.innerHTML = htmlString;
}

// Helper to mock successful API response
function mockAPISuccess(data) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data)
  });
}

// Helper to mock API error
function mockAPIError(status, errorMessage) {
  return Promise.resolve({
    ok: false,
    status: status,
    json: () => Promise.resolve({ error: errorMessage })
  });
}

module.exports = {
  loadHTML,
  mockAPISuccess,
  mockAPIError
};
