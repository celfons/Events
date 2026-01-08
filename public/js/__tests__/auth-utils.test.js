/**
 * @jest-environment jsdom
 */

// Import the functions by executing the script in the global scope
const fs = require('fs');
const path = require('path');

// Load the auth-utils.js file
const authUtilsPath = path.join(__dirname, '..', 'auth-utils.js');
const authUtilsCode = fs.readFileSync(authUtilsPath, 'utf8');

describe('auth-utils.js', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Execute the auth-utils code to make functions available
    eval(authUtilsCode);
    
    // Make functions available to the test
    global.saveToken = saveToken;
    global.getToken = getToken;
    global.clearAuthData = clearAuthData;
    global.getUser = getUser;
    global.isTokenValid = isTokenValid;
    global.isSuperuser = isSuperuser;
    
    // Reset Date.now to prevent test flakiness
    jest.spyOn(Date, 'now').mockReturnValue(1000000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveToken', () => {
    it('should save token, user, and expiration to localStorage', () => {
      const token = 'test-token-123';
      const user = { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' };
      
      saveToken(token, user);
      
      expect(localStorage.getItem('token')).toBe(token);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(user));
      expect(localStorage.getItem('tokenExpiration')).toBeTruthy();
    });

    it('should set token expiration to 24 hours from now', () => {
      const token = 'test-token-123';
      const user = { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' };
      const now = 1000000000;
      const expectedExpiration = now + (24 * 60 * 60 * 1000);
      
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      saveToken(token, user);
      
      const storedExpiration = parseInt(localStorage.getItem('tokenExpiration'));
      expect(storedExpiration).toBe(expectedExpiration);
    });
  });

  describe('getToken', () => {
    it('should return token if not expired', () => {
      const token = 'test-token-123';
      const futureExpiration = Date.now() + 1000000; // 1000 seconds in the future
      
      localStorage.setItem('token', token);
      localStorage.setItem('tokenExpiration', futureExpiration.toString());
      
      expect(getToken()).toBe(token);
    });

    it('should return null if token does not exist', () => {
      expect(getToken()).toBeNull();
    });

    it('should return null if expiration does not exist', () => {
      localStorage.setItem('token', 'test-token-123');
      
      expect(getToken()).toBeNull();
    });

    it('should return null and clear data if token is expired', () => {
      const token = 'test-token-123';
      const pastExpiration = Date.now() - 1000; // Expired 1 second ago
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ username: 'test' }));
      localStorage.setItem('tokenExpiration', pastExpiration.toString());
      
      expect(getToken()).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('tokenExpiration')).toBeNull();
    });
  });

  describe('clearAuthData', () => {
    it('should remove all auth data from localStorage', () => {
      localStorage.setItem('token', 'test-token-123');
      localStorage.setItem('user', JSON.stringify({ username: 'test' }));
      localStorage.setItem('tokenExpiration', '123456789');
      
      clearAuthData();
      
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('tokenExpiration')).toBeNull();
    });
  });

  describe('getUser', () => {
    it('should return parsed user object if user exists', () => {
      const user = { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' };
      localStorage.setItem('user', JSON.stringify(user));
      
      expect(getUser()).toEqual(user);
    });

    it('should return null if user does not exist', () => {
      expect(getUser()).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('user', 'invalid-json');
      
      expect(() => getUser()).toThrow();
    });
  });

  describe('isTokenValid', () => {
    it('should return true if token is valid', () => {
      const token = 'test-token-123';
      const futureExpiration = Date.now() + 1000000;
      
      localStorage.setItem('token', token);
      localStorage.setItem('tokenExpiration', futureExpiration.toString());
      
      expect(isTokenValid()).toBe(true);
    });

    it('should return false if token is expired', () => {
      const token = 'test-token-123';
      const pastExpiration = Date.now() - 1000;
      
      localStorage.setItem('token', token);
      localStorage.setItem('tokenExpiration', pastExpiration.toString());
      
      expect(isTokenValid()).toBe(false);
    });

    it('should return false if token does not exist', () => {
      expect(isTokenValid()).toBe(false);
    });
  });

  describe('isSuperuser', () => {
    it('should return true if user role is superuser', () => {
      const user = { id: '1', username: 'admin', email: 'admin@example.com', role: 'superuser' };
      localStorage.setItem('user', JSON.stringify(user));
      
      expect(isSuperuser()).toBe(true);
    });

    it('should return false if user role is not superuser', () => {
      const user = { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' };
      localStorage.setItem('user', JSON.stringify(user));
      
      expect(isSuperuser()).toBe(false);
    });

    it('should return falsy if user does not exist', () => {
      expect(isSuperuser()).toBeFalsy();
    });

    it('should return false if user has no role', () => {
      const user = { id: '1', username: 'testuser', email: 'test@example.com' };
      localStorage.setItem('user', JSON.stringify(user));
      
      expect(isSuperuser()).toBe(false);
    });
  });
});
