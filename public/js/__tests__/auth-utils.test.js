/**
 * @jest-environment jsdom
 */

// Import the functions from auth-utils.js
// Since the file is not a module, we need to load it
const fs = require('fs');
const path = require('path');
const authUtilsPath = path.join(__dirname, '../auth-utils.js');
const authUtilsCode = fs.readFileSync(authUtilsPath, 'utf8');

// Execute the code in the current context to define the functions
eval(authUtilsCode);

describe('auth-utils.js', () => {
  let store;

  beforeEach(() => {
    // Reset localStorage store before each test
    store = {};
    
    // Mock localStorage with jest functions
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
          delete store[key];
        }),
        clear: jest.fn(() => {
          store = {};
        }),
      },
      writable: true
    });
  });

  describe('saveToken', () => {
    it('should save token, user and expiration time to localStorage', () => {
      const token = 'test-token-123';
      const user = { id: '1', username: 'testuser', role: 'user' };
      
      saveToken(token, user);
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith('token', token);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
      expect(window.localStorage.setItem).toHaveBeenCalledWith('tokenExpiration', expect.any(String));
    });

    it('should set expiration time 24 hours in the future', () => {
      const token = 'test-token-123';
      const user = { id: '1', username: 'testuser' };
      const now = Date.now();
      
      saveToken(token, user);
      
      const expirationCall = window.localStorage.setItem.mock.calls.find(
        call => call[0] === 'tokenExpiration'
      );
      const expirationTime = parseInt(expirationCall[1]);
      
      // Should be approximately 24 hours from now (within 1 second tolerance)
      const expectedExpiration = now + (24 * 60 * 60 * 1000);
      expect(expirationTime).toBeGreaterThanOrEqual(expectedExpiration - 1000);
      expect(expirationTime).toBeLessThanOrEqual(expectedExpiration + 1000);
    });
  });

  describe('getToken', () => {
    it('should return token if valid and not expired', () => {
      const token = 'test-token-123';
      const futureTime = Date.now() + (1000 * 60 * 60); // 1 hour in future
      
      store['token'] = token;
      store['tokenExpiration'] = futureTime.toString();
      
      const result = getToken();
      
      expect(result).toBe(token);
    });

    it('should return null if token is expired', () => {
      const token = 'test-token-123';
      const pastTime = Date.now() - (1000 * 60 * 60); // 1 hour in past
      
      store['token'] = token;
      store['user'] = JSON.stringify({ id: '1' });
      store['tokenExpiration'] = pastTime.toString();
      
      const result = getToken();
      
      expect(result).toBeNull();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('tokenExpiration');
    });

    it('should return null if token does not exist', () => {
      const result = getToken();
      
      expect(result).toBeNull();
    });

    it('should return null if expiration time does not exist', () => {
      store['token'] = 'test-token-123';
      
      const result = getToken();
      
      expect(result).toBeNull();
    });
  });

  describe('clearAuthData', () => {
    it('should remove all auth data from localStorage', () => {
      store['token'] = 'test-token';
      store['user'] = JSON.stringify({ id: '1' });
      store['tokenExpiration'] = '123456789';
      
      clearAuthData();
      
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('tokenExpiration');
    });
  });

  describe('getUser', () => {
    it('should return parsed user object from localStorage', () => {
      const user = { id: '1', username: 'testuser', role: 'user' };
      store['user'] = JSON.stringify(user);
      
      const result = getUser();
      
      expect(result).toEqual(user);
    });

    it('should return null if user does not exist in localStorage', () => {
      const result = getUser();
      
      expect(result).toBeNull();
    });
  });

  describe('isTokenValid', () => {
    it('should return true if token is valid', () => {
      const token = 'test-token-123';
      const futureTime = Date.now() + (1000 * 60 * 60);
      
      store['token'] = token;
      store['tokenExpiration'] = futureTime.toString();
      
      const result = isTokenValid();
      
      expect(result).toBe(true);
    });

    it('should return false if token is expired', () => {
      const token = 'test-token-123';
      const pastTime = Date.now() - (1000 * 60 * 60);
      
      store['token'] = token;
      store['tokenExpiration'] = pastTime.toString();
      
      const result = isTokenValid();
      
      expect(result).toBe(false);
    });

    it('should return false if token does not exist', () => {
      const result = isTokenValid();
      
      expect(result).toBe(false);
    });
  });

  describe('isSuperuser', () => {
    it('should return true if user has superuser role', () => {
      const user = { id: '1', username: 'admin', role: 'superuser' };
      store['user'] = JSON.stringify(user);
      
      const result = isSuperuser();
      
      expect(result).toBe(true);
    });

    it('should return false if user has regular role', () => {
      const user = { id: '1', username: 'testuser', role: 'user' };
      store['user'] = JSON.stringify(user);
      
      const result = isSuperuser();
      
      expect(result).toBe(false);
    });

    it('should return false if user does not exist', () => {
      const result = isSuperuser();
      
      expect(result).toBeFalsy();
    });

    it('should return false if user object is invalid', () => {
      store['user'] = 'invalid-json';
      
      expect(() => isSuperuser()).toThrow();
    });
  });
});
