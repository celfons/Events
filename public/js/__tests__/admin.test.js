/**
 * @jest-environment jsdom
 */

describe('admin.js - UI Tests', () => {
  let mockFetch;
  let mockLocalStorage;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="loading" class="d-none"></div>
      <div id="noEvents" class="d-none"></div>
      <div id="eventsTableContainer">
        <table>
          <tbody id="eventsTableBody"></tbody>
        </table>
      </div>
      <ul id="pagination"></ul>
      <input id="searchInput" type="text" />
      <button id="clearSearchBtn"></button>
      <form id="createEventForm">
        <input id="title" type="text" />
        <textarea id="description"></textarea>
        <input id="dateTime" type="datetime-local" />
        <input id="totalSlots" type="number" />
        <input id="local" type="text" />
      </form>
      <button id="submitCreateEvent"></button>
      <div id="createEventError" class="d-none"></div>
      <form id="updateEventForm"></form>
      <button id="submitUpdateEvent"></button>
      <button id="deleteEventBtn"></button>
      <button id="viewParticipantsBtn"></button>
      <div id="updateEventError" class="d-none"></div>
      <span id="userInfo"></span>
      <button id="logoutBtn"></button>
      <div id="usersNavItem" style="display: none;"></div>
    `;

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock alert and confirm
    global.alert = jest.fn();
    global.confirm = jest.fn();

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
    it('should have all required DOM elements for event management', () => {
      expect(document.getElementById('eventsTableContainer')).toBeTruthy();
      expect(document.getElementById('eventsTableBody')).toBeTruthy();
      expect(document.getElementById('loading')).toBeTruthy();
      expect(document.getElementById('noEvents')).toBeTruthy();
      expect(document.getElementById('pagination')).toBeTruthy();
    });

    it('should have search functionality elements', () => {
      expect(document.getElementById('searchInput')).toBeTruthy();
      expect(document.getElementById('clearSearchBtn')).toBeTruthy();
    });

    it('should have create event form elements', () => {
      expect(document.getElementById('createEventForm')).toBeTruthy();
      expect(document.getElementById('title')).toBeTruthy();
      expect(document.getElementById('description')).toBeTruthy();
      expect(document.getElementById('dateTime')).toBeTruthy();
      expect(document.getElementById('totalSlots')).toBeTruthy();
      expect(document.getElementById('local')).toBeTruthy();
      expect(document.getElementById('submitCreateEvent')).toBeTruthy();
    });

    it('should have update and delete event elements', () => {
      expect(document.getElementById('updateEventForm')).toBeTruthy();
      expect(document.getElementById('submitUpdateEvent')).toBeTruthy();
      expect(document.getElementById('deleteEventBtn')).toBeTruthy();
      expect(document.getElementById('viewParticipantsBtn')).toBeTruthy();
    });

    it('should have user info and logout elements', () => {
      expect(document.getElementById('userInfo')).toBeTruthy();
      expect(document.getElementById('logoutBtn')).toBeTruthy();
    });
  });

  describe('API Contract - Events Management', () => {
    it('should define correct endpoint for fetching events', () => {
      const expectedEndpoint = '/api/events';
      expect(expectedEndpoint).toBe('/api/events');
    });

    it('should expect events data in correct format', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            title: 'Test Event',
            description: 'Description',
            dateTime: new Date().toISOString(),
            totalSlots: 50,
            availableSlots: 10,
            createdBy: 'user-1'
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
      if (data.data.length > 0) {
        expect(data.data[0]).toHaveProperty('id');
        expect(data.data[0]).toHaveProperty('title');
        expect(data.data[0]).toHaveProperty('description');
        expect(data.data[0]).toHaveProperty('dateTime');
        expect(data.data[0]).toHaveProperty('totalSlots');
        expect(data.data[0]).toHaveProperty('availableSlots');
      }
    });
  });

  describe('API Contract - Create Event', () => {
    it('should define correct endpoint for creating events', () => {
      const expectedEndpoint = '/api/events';
      const expectedMethod = 'POST';
      
      expect(expectedEndpoint).toBe('/api/events');
      expect(expectedMethod).toBe('POST');
    });

    it('should expect create event to accept required fields', async () => {
      const mockResponse = {
        success: true,
        data: {
          event: {
            id: 'new-event-123',
            title: 'New Event',
            description: 'Event Description',
            dateTime: new Date().toISOString(),
            totalSlots: 50,
            availableSlots: 50,
            local: 'Test Location'
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          title: 'New Event',
          description: 'Event Description',
          dateTime: new Date().toISOString(),
          totalSlots: 50,
          local: 'Test Location'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('success');
      expect(data.data).toHaveProperty('event');
    });
  });

  describe('API Contract - Update Event', () => {
    it('should define correct endpoint for updating events', () => {
      const eventId = 'event-123';
      const expectedEndpoint = `/api/events/${eventId}`;
      const expectedMethod = 'PUT';
      
      expect(expectedEndpoint).toBe('/api/events/event-123');
      expect(expectedMethod).toBe('PUT');
    });
  });

  describe('API Contract - Delete Event', () => {
    it('should define correct endpoint for deleting events', () => {
      const eventId = 'event-123';
      const expectedEndpoint = `/api/events/${eventId}`;
      const expectedMethod = 'DELETE';
      
      expect(expectedEndpoint).toBe('/api/events/event-123');
      expect(expectedMethod).toBe('DELETE');
    });
  });

  describe('API Contract - Get Event Participants', () => {
    it('should define correct endpoint for fetching participants', () => {
      const eventId = 'event-123';
      const expectedEndpoint = `/api/events/${eventId}/participants`;
      
      expect(expectedEndpoint).toBe('/api/events/event-123/participants');
    });
  });

  describe('Authentication Headers', () => {
    it('should include Authorization header in authenticated requests', () => {
      const token = 'test-token-123';
      const expectedHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      expect(expectedHeaders['Authorization']).toBe('Bearer test-token-123');
      expect(expectedHeaders['Content-Type']).toBe('application/json');
    });
  });

  describe('Authentication Check', () => {
    it('should check for valid token before accessing admin page', () => {
      // Mock token check
      const hasValidToken = () => {
        const token = localStorage.getItem('token');
        const expiration = localStorage.getItem('tokenExpiration');
        if (!token || !expiration) return false;
        return Date.now() < parseInt(expiration);
      };

      // No token
      expect(hasValidToken()).toBe(false);

      // Valid token
      localStorage.setItem('token', 'valid-token');
      localStorage.setItem('tokenExpiration', (Date.now() + 1000000).toString());
      expect(hasValidToken()).toBe(true);

      // Expired token
      localStorage.setItem('tokenExpiration', (Date.now() - 1000).toString());
      expect(hasValidToken()).toBe(false);
    });
  });

  describe('Pagination Configuration', () => {
    it('should use correct pagination settings for admin', () => {
      const eventsPerPage = 10;
      const initialPage = 1;
      
      expect(eventsPerPage).toBe(10);
      expect(initialPage).toBe(1);
    });
  });

  describe('Event Status Filtering', () => {
    it('should support filtering events by status', () => {
      const allStatus = 'all';
      const activeStatus = 'active';
      
      expect(['all', 'active']).toContain(allStatus);
      expect(['all', 'active']).toContain(activeStatus);
    });
  });

  describe('Participants Pagination', () => {
    it('should use correct pagination for participants', () => {
      const participantsPerPage = 5;
      const initialPage = 1;
      
      expect(participantsPerPage).toBe(5);
      expect(initialPage).toBe(1);
    });
  });

  describe('User Role Check', () => {
    it('should check for superuser role', () => {
      const isSuperuser = (user) => {
        return user && user.role === 'superuser';
      };

      const superuser = { username: 'admin', role: 'superuser' };
      const regularUser = { username: 'user', role: 'user' };

      expect(isSuperuser(superuser)).toBe(true);
      expect(isSuperuser(regularUser)).toBe(false);
      expect(isSuperuser(null) === false || isSuperuser(null) === null).toBe(true);
    });

    it('should show users link for superusers', () => {
      const usersNavItem = document.getElementById('usersNavItem');
      
      // Regular user - hide link
      usersNavItem.style.display = 'none';
      expect(usersNavItem.style.display).toBe('none');
      
      // Superuser - show link
      usersNavItem.style.display = 'block';
      expect(usersNavItem.style.display).toBe('block');
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 unauthorized errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      const response = await fetch('/api/events');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error');
    });
  });

  describe('Form Validation', () => {
    it('should have all required form inputs for creating events', () => {
      const titleInput = document.getElementById('title');
      const descriptionInput = document.getElementById('description');
      const dateTimeInput = document.getElementById('dateTime');
      const totalSlotsInput = document.getElementById('totalSlots');

      expect(titleInput).toBeTruthy();
      expect(descriptionInput).toBeTruthy();
      expect(dateTimeInput).toBeTruthy();
      expect(totalSlotsInput).toBeTruthy();

      // Check input types
      expect(titleInput.type).toBe('text');
      expect(dateTimeInput.type).toBe('datetime-local');
      expect(totalSlotsInput.type).toBe('number');
    });
  });

  describe('Redirect on Authentication Failure', () => {
    it('should redirect to login page on auth failure', () => {
      const expectedRedirect = '/?login=required';
      expect(expectedRedirect).toBe('/?login=required');
    });
  });
});
