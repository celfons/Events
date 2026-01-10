/**
 * @jest-environment jsdom
 */

// Mock localStorage for tests
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

// Import the module to test
const fs = require('fs');
const path = require('path');
const authUtilsCode = fs.readFileSync(
  path.join(__dirname, '../auth-utils.js'),
  'utf8'
);

// Execute the code in the global scope
eval(authUtilsCode);

describe('auth-utils.js', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    describe('saveToken', () => {
      it('should save token, user, and expiration to localStorage', () => {
        const mockToken = 'test-token-123';
        const mockUser = { id: '1', username: 'testuser', role: 'user' };
        
        saveToken(mockToken, mockUser);
        
        expect(localStorage.getItem('token')).toBe(mockToken);
        expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
        expect(localStorage.getItem('tokenExpiration')).toBeDefined();
      });

      it('should set expiration time 24 hours in the future', () => {
        const mockToken = 'test-token';
        const mockUser = { id: '1', username: 'test' };
        const beforeSave = Date.now();
        
        saveToken(mockToken, mockUser);
        
        const expirationTime = parseInt(localStorage.getItem('tokenExpiration'));
        const expectedExpiration = beforeSave + (24 * 60 * 60 * 1000);
        
        // Allow 1 second tolerance for test execution time
        expect(expirationTime).toBeGreaterThanOrEqual(expectedExpiration);
        expect(expirationTime).toBeLessThanOrEqual(expectedExpiration + 1000);
      });
    });

    describe('getToken', () => {
      it('should return token if valid and not expired', () => {
        const mockToken = 'valid-token';
        const futureExpiration = Date.now() + (1000 * 60 * 60); // 1 hour from now
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('tokenExpiration', futureExpiration.toString());
        
        expect(getToken()).toBe(mockToken);
      });

      it('should return null if token does not exist', () => {
        expect(getToken()).toBeNull();
      });

      it('should return null if expiration time does not exist', () => {
        localStorage.setItem('token', 'some-token');
        
        expect(getToken()).toBeNull();
      });

      it('should return null and clear data if token is expired', () => {
        const mockToken = 'expired-token';
        const pastExpiration = Date.now() - 1000; // 1 second ago
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify({ id: '1' }));
        localStorage.setItem('tokenExpiration', pastExpiration.toString());
        
        expect(getToken()).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(localStorage.getItem('tokenExpiration')).toBeNull();
      });
    });

    describe('clearAuthData', () => {
      it('should remove all auth-related data from localStorage', () => {
        localStorage.setItem('token', 'test-token');
        localStorage.setItem('user', JSON.stringify({ id: '1' }));
        localStorage.setItem('tokenExpiration', '123456789');
        
        clearAuthData();
        
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(localStorage.getItem('tokenExpiration')).toBeNull();
      });
    });

    describe('getUser', () => {
      it('should return parsed user object if exists', () => {
        const mockUser = { id: '1', username: 'testuser', email: 'test@test.com' };
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        const user = getUser();
        
        expect(user).toEqual(mockUser);
      });

      it('should return null if user does not exist', () => {
        expect(getUser()).toBeNull();
      });
    });

    describe('isTokenValid', () => {
      it('should return true if token is valid', () => {
        const futureExpiration = Date.now() + (1000 * 60 * 60);
        localStorage.setItem('token', 'valid-token');
        localStorage.setItem('tokenExpiration', futureExpiration.toString());
        
        expect(isTokenValid()).toBe(true);
      });

      it('should return false if token is invalid or expired', () => {
        expect(isTokenValid()).toBe(false);
      });
    });

    describe('isSuperuser', () => {
      it('should return true if user is a superuser', () => {
        const superuser = { id: '1', username: 'admin', role: 'superuser' };
        localStorage.setItem('user', JSON.stringify(superuser));
        
        expect(isSuperuser()).toBe(true);
      });

      it('should return false if user is not a superuser', () => {
        const regularUser = { id: '2', username: 'user', role: 'user' };
        localStorage.setItem('user', JSON.stringify(regularUser));
        
        expect(isSuperuser()).toBe(false);
      });

      it('should return false if no user is logged in', () => {
        const result = isSuperuser();
        expect(result === false || result === null).toBe(true);
      });
    });
  });

  describe('Token Expiration Constant', () => {
    it('should define TOKEN_EXPIRATION_HOURS as 24', () => {
      // TOKEN_EXPIRATION_HOURS is defined as a const in the module
      // We verify it indirectly by checking token expiration behavior
      const mockToken = 'test-token';
      const mockUser = { id: '1', username: 'test' };
      const beforeSave = Date.now();
      
      saveToken(mockToken, mockUser);
      
      const expirationTime = parseInt(localStorage.getItem('tokenExpiration'));
      const hoursDiff = (expirationTime - beforeSave) / (1000 * 60 * 60);
      
      // Should be 24 hours (allow small tolerance for execution time)
      expect(hoursDiff).toBeGreaterThanOrEqual(23.99);
      expect(hoursDiff).toBeLessThanOrEqual(24.01);
    });
  });
});
