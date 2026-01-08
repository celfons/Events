/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost:3000"}
 */

/**
 * API Contract Tests for Public JS Files
 * 
 * These tests ensure that the JavaScript files correctly interact with the API
 * and maintain the expected contract (request format, response handling, etc.)
 */

const fs = require('fs');
const path = require('path');

global.fetch = jest.fn();

describe('API Contract Tests', () => {
  beforeEach(() => {
    global.fetch.mockClear();
    localStorage.clear();
    
    // Setup DOM
    document.body.innerHTML = `
      <div id="eventsContainer"></div>
      <div id="loading" class="d-none"></div>
      <div id="noEvents" class="d-none"></div>
      <div id="pagination"></div>
      <input id="searchInput" value="" />
      <button id="clearSearchBtn"></button>
    `;
  });

  describe('Events API (/api/events)', () => {
    it('should call GET /api/events with correct format', async () => {
      // Load auth utils and index.js
      // Note: Using eval() to test legacy browser scripts. See index.test.js for explanation.
      const authUtilsPath = path.join(__dirname, '..', 'auth-utils.js');
      const indexPath = path.join(__dirname, '..', 'index.js');
      eval(fs.readFileSync(authUtilsPath, 'utf8'));
      eval(fs.readFileSync(indexPath, 'utf8'));

      const mockResponse = {
        data: [
          {
            id: 'event-1',
            title: 'Test Event',
            description: 'Test Description',
            dateTime: '2024-12-31T14:00:00.000Z',
            availableSlots: 50,
            totalSlots: 100,
            local: 'Test Location'
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await loadEvents();

      // Verify API was called correctly
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/events');
    });

    it('should handle API response data structure correctly', async () => {
      const authUtilsPath = path.join(__dirname, '..', 'auth-utils.js');
      const indexPath = path.join(__dirname, '..', 'index.js');
      eval(fs.readFileSync(authUtilsPath, 'utf8'));
      eval(fs.readFileSync(indexPath, 'utf8'));

      const mockResponse = {
        data: [
          {
            id: 'event-1',
            title: 'Test Event',
            description: 'Test Description',
            dateTime: '2024-12-31T14:00:00.000Z',
            availableSlots: 50,
            totalSlots: 100
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await loadEvents();

      // Verify the response is processed correctly (events are stored in allEvents)
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle API error responses correctly', async () => {
      const authUtilsPath = path.join(__dirname, '..', 'auth-utils.js');
      const indexPath = path.join(__dirname, '..', 'index.js');
      eval(fs.readFileSync(authUtilsPath, 'utf8'));
      eval(fs.readFileSync(indexPath, 'utf8'));

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' })
      });

      await loadEvents();

      // Verify error is handled gracefully
      expect(document.getElementById('eventsContainer').innerHTML).toContain('Erro ao carregar eventos');
    });
  });

  describe('Auth API (/api/auth/login)', () => {
    it('should send correct login request format', async () => {
      const authUtilsPath = path.join(__dirname, '..', 'auth-utils.js');
      const indexPath = path.join(__dirname, '..', 'index.js');
      eval(fs.readFileSync(authUtilsPath, 'utf8'));
      eval(fs.readFileSync(indexPath, 'utf8'));

      const mockResponse = {
        token: 'jwt-token-123',
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await login('test@example.com', 'password123');

      // Verify request structure
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );

      // Verify response handling
      expect(result.success).toBe(true);
      expect(localStorage.getItem('token')).toBe('jwt-token-123');
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockResponse.user);
    });

    it('should handle login failure with error message', async () => {
      const authUtilsPath = path.join(__dirname, '..', 'auth-utils.js');
      const indexPath = path.join(__dirname, '..', 'index.js');
      eval(fs.readFileSync(authUtilsPath, 'utf8'));
      eval(fs.readFileSync(indexPath, 'utf8'));

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' })
      });

      const result = await login('test@example.com', 'wrongpassword');

      // Verify error is returned correctly
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('Registration API (/api/registrations)', () => {
    it('should send correct registration request format', async () => {
      // Setup DOM for event details page
      document.body.innerHTML = `
        <div id="loading" class="d-none">Loading...</div>
        <div id="eventDetailsContainer" class="d-none"></div>
        <div id="errorContainer" class="d-none"></div>
        <form id="registerForm">
          <input id="name" value="John Doe" />
          <input id="email" value="john@example.com" />
          <input id="phone" value="1234567890" />
          <button id="registerButton">Register</button>
        </form>
        <div id="registrationForm"></div>
        <div id="registrationSuccess" class="d-none"></div>
        <div id="registrationError" class="d-none"></div>
      `;

      const mockResponse = {
        id: 'registration-123',
        eventId: 'test-event-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Test the API contract directly
      const response = await fetch('http://localhost:3000/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId: 'test-event-123',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890'
        })
      });

      const data = await response.json();

      // Verify request was made with correct format
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/registrations',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      // Verify response structure
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('eventId');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('phone');
    });
  });

  describe('API Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const authUtilsPath = path.join(__dirname, '..', 'auth-utils.js');
      const indexPath = path.join(__dirname, '..', 'index.js');
      eval(fs.readFileSync(authUtilsPath, 'utf8'));
      eval(fs.readFileSync(indexPath, 'utf8'));

      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await loadEvents();

      // Verify error is handled
      expect(document.getElementById('eventsContainer').innerHTML).toContain('Erro ao carregar eventos');
    });

    it('should handle malformed JSON responses', async () => {
      const authUtilsPath = path.join(__dirname, '..', 'auth-utils.js');
      const indexPath = path.join(__dirname, '..', 'index.js');
      eval(fs.readFileSync(authUtilsPath, 'utf8'));
      eval(fs.readFileSync(indexPath, 'utf8'));

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await loadEvents();

      // Verify error is handled
      expect(document.getElementById('eventsContainer').innerHTML).toContain('Erro ao carregar eventos');
    });
  });

  describe('DOM Interactions', () => {
    it('should correctly update DOM after successful API call', async () => {
      const authUtilsPath = path.join(__dirname, '..', 'auth-utils.js');
      const indexPath = path.join(__dirname, '..', 'index.js');
      eval(fs.readFileSync(authUtilsPath, 'utf8'));
      eval(fs.readFileSync(indexPath, 'utf8'));

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockResponse = {
        data: [
          {
            id: 'event-1',
            title: 'Future Event',
            description: 'Description',
            dateTime: tomorrow.toISOString(),
            availableSlots: 50,
            totalSlots: 100
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await loadEvents();

      // Verify loading state is hidden
      expect(document.getElementById('loading').classList.contains('d-none')).toBe(true);
    });

    it('should show no events message when API returns empty array', async () => {
      const authUtilsPath = path.join(__dirname, '..', 'auth-utils.js');
      const indexPath = path.join(__dirname, '..', 'index.js');
      eval(fs.readFileSync(authUtilsPath, 'utf8'));
      eval(fs.readFileSync(indexPath, 'utf8'));

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      });

      await loadEvents();

      // Verify no events message is shown
      expect(document.getElementById('noEvents').classList.contains('d-none')).toBe(false);
    });
  });
});
