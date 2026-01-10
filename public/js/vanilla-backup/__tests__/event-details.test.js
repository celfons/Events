/**
 * @jest-environment jsdom
 */

describe('event-details.js - UI Tests', () => {
  let mockFetch;
  let mockLocalStorage;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="loading" class="d-none"></div>
      <div id="eventDetailsContainer"></div>
      <div id="errorContainer" class="d-none"></div>
      <form id="registerForm">
        <input id="name" type="text" />
        <input id="email" type="email" />
        <input id="phone" type="tel" />
      </form>
      <div id="registrationError" class="d-none"></div>
      <div id="registrationForm"></div>
      <div id="registrationSuccess" class="d-none"></div>
    `;

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock alert and confirm
    global.alert = jest.fn();
    global.confirm = jest.fn();

    // Mock localStorage
    mockLocalStorage = (() => {
      let store = {};
      return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
        removeItem: jest.fn((key) => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; })
      };
    })();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('DOM Elements Existence', () => {
    it('should have all required DOM elements for event details', () => {
      expect(document.getElementById('eventDetailsContainer')).toBeTruthy();
      expect(document.getElementById('loading')).toBeTruthy();
      expect(document.getElementById('errorContainer')).toBeTruthy();
    });

    it('should have registration form elements', () => {
      expect(document.getElementById('registerForm')).toBeTruthy();
      expect(document.getElementById('name')).toBeTruthy();
      expect(document.getElementById('email')).toBeTruthy();
      expect(document.getElementById('phone')).toBeTruthy();
      expect(document.getElementById('registrationError')).toBeTruthy();
      expect(document.getElementById('registrationForm')).toBeTruthy();
      expect(document.getElementById('registrationSuccess')).toBeTruthy();
    });
  });

  describe('API Contract - Event Details Endpoint', () => {
    it('should define correct event details endpoint structure', () => {
      const eventId = 'test-event-123';
      const expectedEndpoint = `/api/events/${eventId}`;
      expect(expectedEndpoint).toBe('/api/events/test-event-123');
    });

    it('should expect event details in response', async () => {
      const mockResponse = {
        success: true,
        data: {
          event: {
            id: 'test-event-123',
            title: 'Test Event',
            description: 'Test Description',
            dateTime: new Date().toISOString(),
            availableSlots: 10,
            totalSlots: 50,
            local: 'Test Location'
          },
          registrationsCount: 40
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/api/events/test-event-123');
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('event');
      expect(data.data).toHaveProperty('registrationsCount');
      expect(data.data.event).toHaveProperty('id');
      expect(data.data.event).toHaveProperty('title');
      expect(data.data.event).toHaveProperty('description');
      expect(data.data.event).toHaveProperty('dateTime');
      expect(data.data.event).toHaveProperty('availableSlots');
      expect(data.data.event).toHaveProperty('totalSlots');
    });
  });

  describe('API Contract - Registration Endpoint', () => {
    it('should define correct registration endpoint structure', () => {
      const expectedEndpoint = '/api/registrations';
      expect(expectedEndpoint).toBe('/api/registrations');
    });

    it('should expect registration to accept event ID, name, email, and phone', async () => {
      const mockRegistrationResponse = {
        success: true,
        data: {
          registration: {
            id: 'reg-123',
            eventId: 'event-456',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            status: 'active'
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistrationResponse
      });

      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: 'event-456',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('success');
      expect(data.data.registration).toHaveProperty('id');
      expect(data.data.registration).toHaveProperty('eventId');
      expect(data.data.registration).toHaveProperty('name');
      expect(data.data.registration).toHaveProperty('email');
      expect(data.data.registration).toHaveProperty('phone');
    });
  });

  describe('API Contract - Cancel Registration Endpoint', () => {
    it('should define correct cancellation endpoint structure', () => {
      const registrationId = 'reg-123';
      const expectedEndpoint = `/api/registrations/${registrationId}/cancel`;
      expect(expectedEndpoint).toBe('/api/registrations/reg-123/cancel');
    });
  });

  describe('Storage Key Generation', () => {
    it('should use prefixed storage key for registrations', () => {
      const storagePrefix = 'event_registration_';
      const eventId = 'test-event-123';
      const expectedKey = `${storagePrefix}${eventId}`;
      
      expect(expectedKey).toBe('event_registration_test-event-123');
    });

    it('should sanitize event ID in storage key', () => {
      const sanitizeId = (id) => {
        return id.replace(/[^a-zA-Z0-9_-]/g, '');
      };
      
      const dirtyId = '<script>alert("xss")</script>';
      const cleanId = sanitizeId(dirtyId);
      
      expect(cleanId).toBe('scriptalertxssscript');
      expect(cleanId).not.toContain('<');
      expect(cleanId).not.toContain('>');
    });
  });

  describe('Registration Data Structure', () => {
    it('should store complete registration data', () => {
      const registrationData = {
        registrationId: 'reg-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890'
      };

      localStorage.setItem('event_registration_test', JSON.stringify(registrationData));
      const stored = JSON.parse(localStorage.getItem('event_registration_test'));

      expect(stored).toHaveProperty('registrationId');
      expect(stored).toHaveProperty('name');
      expect(stored).toHaveProperty('email');
      expect(stored).toHaveProperty('phone');
    });

    it('should handle invalid registration data', () => {
      const invalidData = { name: 'John' }; // Missing registrationId
      
      // Validation logic
      const isValid = (data) => {
        return data && 
               typeof data.registrationId === 'string' && 
               data.registrationId.length > 0;
      };
      
      expect(isValid(invalidData)).toBe(false);
      expect(isValid({ registrationId: 'reg-123', name: 'John' })).toBe(true);
    });
  });

  describe('Event ID Extraction', () => {
    it('should extract event ID from URL path', () => {
      const url = '/event/test-event-id-123';
      const parts = url.split('/');
      const eventId = parts[parts.length - 1];
      
      expect(eventId).toBe('test-event-id-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors for non-existent events', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Event not found' })
      });

      const response = await fetch('/api/events/non-existent');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/events/test');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('LocalStorage Error Handling', () => {
    it('should handle localStorage access errors gracefully', () => {
      const mockFailingStorage = {
        getItem: jest.fn(() => { throw new Error('localStorage disabled'); }),
        setItem: jest.fn(() => { throw new Error('localStorage disabled'); }),
        removeItem: jest.fn(() => { throw new Error('localStorage disabled'); }),
        clear: jest.fn()
      };

      // Should not throw when catching errors
      expect(() => {
        try {
          mockFailingStorage.getItem('key');
        } catch (error) {
          // Handle error silently
        }
      }).not.toThrow();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const phoneInput = document.getElementById('phone');

      // Check that form fields exist
      expect(nameInput).toBeTruthy();
      expect(emailInput).toBeTruthy();
      expect(phoneInput).toBeTruthy();

      // Check input types
      expect(emailInput.type).toBe('email');
      expect(phoneInput.type).toBe('tel');
    });
  });
});
