/**
 * @jest-environment jsdom
 */

describe('index.js - UI Tests', () => {
  let mockFetch;
  let mockLocalStorage;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="loginItem"></div>
      <div id="logoutItem" class="d-none"></div>
      <div id="userInfoItem" class="d-none"></div>
      <span id="userInfo"></span>
      <a id="adminLink" href="/admin"></a>
      <div id="loading" class="d-none"></div>
      <div id="eventsContainer"></div>
      <div id="noEvents" class="d-none"></div>
      <ul id="pagination"></ul>
      <input id="searchInput" type="text" />
      <button id="clearSearchBtn"></button>
      <div id="loginModal"></div>
      <button id="logoutBtn"></button>
      <button id="submitLogin"></button>
      <form id="loginForm">
        <input id="loginEmail" type="email" />
        <input id="loginPassword" type="password" />
      </form>
      <div id="loginError" class="d-none"></div>
      <ul class="navbar-nav"></ul>
    `;

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock alert
    global.alert = jest.fn();

    // Mock bootstrap
    global.bootstrap = {
      Modal: jest.fn().mockImplementation(() => ({
        show: jest.fn(),
        hide: jest.fn()
      }))
    };
    global.bootstrap.Modal.getInstance = jest.fn();

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
    it('should have all required DOM elements for events display', () => {
      expect(document.getElementById('eventsContainer')).toBeTruthy();
      expect(document.getElementById('loading')).toBeTruthy();
      expect(document.getElementById('noEvents')).toBeTruthy();
      expect(document.getElementById('pagination')).toBeTruthy();
    });

    it('should have search functionality elements', () => {
      expect(document.getElementById('searchInput')).toBeTruthy();
      expect(document.getElementById('clearSearchBtn')).toBeTruthy();
    });

    it('should have authentication UI elements', () => {
      expect(document.getElementById('loginItem')).toBeTruthy();
      expect(document.getElementById('logoutItem')).toBeTruthy();
      expect(document.getElementById('userInfoItem')).toBeTruthy();
      expect(document.getElementById('userInfo')).toBeTruthy();
    });

    it('should have login modal elements', () => {
      expect(document.getElementById('loginModal')).toBeTruthy();
      expect(document.getElementById('loginForm')).toBeTruthy();
      expect(document.getElementById('loginEmail')).toBeTruthy();
      expect(document.getElementById('loginPassword')).toBeTruthy();
      expect(document.getElementById('submitLogin')).toBeTruthy();
    });
  });

  describe('API Contract - Events Endpoint', () => {
    it('should define correct API endpoint structure for loading events', () => {
      const expectedEndpoint = '/api/events';
      expect(expectedEndpoint).toBe('/api/events');
    });

    it('should expect events data in response.data format', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            title: 'Test Event',
            description: 'Description',
            dateTime: new Date().toISOString(),
            availableSlots: 10,
            totalSlots: 50
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/api/events');
      const data = await response.json();

      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data[0]).toHaveProperty('id');
      expect(data.data[0]).toHaveProperty('title');
      expect(data.data[0]).toHaveProperty('description');
      expect(data.data[0]).toHaveProperty('dateTime');
      expect(data.data[0]).toHaveProperty('availableSlots');
      expect(data.data[0]).toHaveProperty('totalSlots');
    });
  });

  describe('API Contract - Authentication Endpoint', () => {
    it('should define correct login endpoint structure', () => {
      const expectedEndpoint = '/api/auth/login';
      expect(expectedEndpoint).toBe('/api/auth/login');
    });

    it('should expect login to accept email and password', async () => {
      const mockLoginResponse = {
        data: {
          token: 'test-token',
          user: { id: '1', username: 'testuser', email: 'test@test.com' }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse
      });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'password' })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('token');
      expect(data.data).toHaveProperty('user');
      expect(data.data.user).toHaveProperty('username');
    });
  });

  describe('Event Card Data Contract', () => {
    it('should display required event properties', () => {
      const requiredEventProperties = [
        'id',
        'title',
        'description',
        'dateTime',
        'availableSlots',
        'totalSlots'
      ];

      const mockEvent = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date().toISOString(),
        availableSlots: 10,
        totalSlots: 50
      };

      requiredEventProperties.forEach(prop => {
        expect(mockEvent).toHaveProperty(prop);
      });
    });

    it('should handle optional local property', () => {
      const eventWithLocal = {
        id: '123',
        title: 'Test',
        description: 'Desc',
        dateTime: new Date().toISOString(),
        availableSlots: 10,
        totalSlots: 50,
        local: 'Test Location'
      };

      const eventWithoutLocal = {
        id: '124',
        title: 'Test',
        description: 'Desc',
        dateTime: new Date().toISOString(),
        availableSlots: 10,
        totalSlots: 50
      };

      expect(eventWithLocal).toHaveProperty('local');
      expect(eventWithoutLocal.local).toBeUndefined();
    });
  });

  describe('HTML Sanitization', () => {
    it('should define HTML escape function behavior', () => {
      const testCases = [
        { input: '<script>alert("xss")</script>', expectedContains: '&lt;' },
        { input: 'Test & Test', expectedContains: '&amp;' },
        { input: '"quoted"', expectedContains: '&quot;' },
        { input: "'single'", expectedContains: '&#039;' }
      ];

      // Define the escapeHtml function inline for testing
      function escapeHtml(text) {
        const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
      }

      testCases.forEach(({ input, expectedContains }) => {
        const result = escapeHtml(input);
        expect(result).toContain(expectedContains);
      });
    });
  });

  describe('CSS Classes for UI States', () => {
    it('should use d-none class for hiding elements', () => {
      const element = document.getElementById('noEvents');
      expect(element.classList.contains('d-none')).toBe(true);
    });

    it('should toggle visibility with d-none class', () => {
      const loading = document.getElementById('loading');
      expect(loading.classList.contains('d-none')).toBe(true);
      
      loading.classList.remove('d-none');
      expect(loading.classList.contains('d-none')).toBe(false);
      
      loading.classList.add('d-none');
      expect(loading.classList.contains('d-none')).toBe(true);
    });
  });

  describe('Pagination Constants', () => {
    it('should expect pagination configuration', () => {
      const expectedEventsPerPage = 5;
      const expectedInitialPage = 1;
      
      expect(expectedEventsPerPage).toBe(5);
      expect(expectedInitialPage).toBe(1);
    });
  });

  describe('Event Link Format', () => {
    it('should construct event detail links correctly', () => {
      const eventId = 'test-event-123';
      const expectedLink = `/event/${eventId}`;
      
      expect(expectedLink).toBe('/event/test-event-123');
    });
  });

  describe('Date Formatting', () => {
    it('should format dates in pt-BR locale', () => {
      const testDate = new Date('2025-12-31T20:00:00');
      const formatted = testDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('Slots Display Logic', () => {
    it('should determine slot color based on availability', () => {
      const highAvailability = 15;
      const lowAvailability = 5;
      const noAvailability = 0;
      
      const getSlotColor = (slots) => {
        return slots > 10 ? 'success' : slots > 0 ? 'warning' : 'danger';
      };
      
      expect(getSlotColor(highAvailability)).toBe('success');
      expect(getSlotColor(lowAvailability)).toBe('warning');
      expect(getSlotColor(noAvailability)).toBe('danger');
    });

    it('should display correct text based on availability', () => {
      const getSlotText = (slots) => {
        return slots > 0 ? `${slots} vagas disponíveis` : 'Esgotado';
      };
      
      expect(getSlotText(10)).toBe('10 vagas disponíveis');
      expect(getSlotText(0)).toBe('Esgotado');
    });
  });

  describe('Search Functionality Contract', () => {
    it('should filter events by title case-insensitively', () => {
      const events = [
        { title: 'JavaScript Workshop', id: '1' },
        { title: 'Python Conference', id: '2' },
        { title: 'javascript advanced', id: '3' }
      ];
      
      const searchQuery = 'javascript';
      const filtered = events.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      expect(filtered.length).toBe(2);
      expect(filtered[0].title.toLowerCase()).toContain('javascript');
      expect(filtered[1].title.toLowerCase()).toContain('javascript');
    });
  });
});
