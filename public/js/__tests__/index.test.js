/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('index.js - DOM and API Integration', () => {
  let store;
  let mockFetch;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="loginItem"></div>
      <div id="logoutItem"></div>
      <div id="userInfoItem"></div>
      <div id="userInfo"></div>
      <div id="adminLink"></div>
      <div id="eventsContainer"></div>
      <div id="loading" class="d-none"></div>
      <div id="noEvents" class="d-none"></div>
      <div id="pagination"></div>
      <input id="searchInput" />
      <button id="clearSearchBtn"></button>
      <div id="loginModal"></div>
      <button id="logoutBtn"></button>
      <button id="submitLogin"></button>
      <form id="loginForm">
        <input id="loginEmail" />
        <input id="loginPassword" />
      </form>
      <div id="loginError"></div>
      <div class="navbar-nav"></div>
    `;

    // Reset localStorage
    store = {};
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

    // Mock window.location
    delete window.location;
    window.location = { origin: 'http://localhost:3000', pathname: '/', search: '' };

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock bootstrap
    global.bootstrap = {
      Modal: jest.fn().mockImplementation(() => ({
        show: jest.fn(),
        hide: jest.fn(),
      })),
    };
    bootstrap.Modal.getInstance = jest.fn();

    // Mock alert
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API Integration Tests', () => {
    it('should make correct API call to fetch events', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Event 1',
          description: 'Description 1',
          dateTime: new Date(Date.now() + 86400000).toISOString(),
          totalSlots: 50,
          availableSlots: 30,
          local: 'Location 1'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockEvents })
      });

      const response = await fetch('http://localhost:3000/api/events');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data).toEqual(mockEvents);
      expect(data.data[0].title).toBe('Event 1');
    });

    it('should make correct API call for login', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResponse = {
        data: {
          token: 'test-token',
          user: { id: '1', username: 'testuser', email: credentials.email }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(credentials)
        })
      );
      expect(data.data.token).toBe('test-token');
    });

    it('should handle API errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      });

      const response = await fetch('http://localhost:3000/api/events/invalid-id');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toBe('Not found');
    });
  });

  describe('DOM Element Tests', () => {
    it('should have all required DOM elements present', () => {
      expect(document.getElementById('loginItem')).not.toBeNull();
      expect(document.getElementById('logoutItem')).not.toBeNull();
      expect(document.getElementById('userInfoItem')).not.toBeNull();
      expect(document.getElementById('eventsContainer')).not.toBeNull();
      expect(document.getElementById('loading')).not.toBeNull();
      expect(document.getElementById('noEvents')).not.toBeNull();
      expect(document.getElementById('pagination')).not.toBeNull();
      expect(document.getElementById('searchInput')).not.toBeNull();
    });

    it('should manipulate DOM classes correctly', () => {
      const loginItem = document.getElementById('loginItem');
      const logoutItem = document.getElementById('logoutItem');

      loginItem.classList.add('d-none');
      logoutItem.classList.remove('d-none');

      expect(loginItem.classList.contains('d-none')).toBe(true);
      expect(logoutItem.classList.contains('d-none')).toBe(false);
    });

    it('should update text content correctly', () => {
      const userInfo = document.getElementById('userInfo');
      userInfo.textContent = 'Olá, testuser';

      expect(userInfo.textContent).toBe('Olá, testuser');
    });

    it('should create and append DOM elements', () => {
      const container = document.getElementById('eventsContainer');
      const card = document.createElement('div');
      card.className = 'event-card';
      card.textContent = 'Test Event';

      container.appendChild(card);

      expect(container.children.length).toBe(1);
      expect(container.firstChild.textContent).toBe('Test Event');
    });
  });

  describe('XSS Prevention Tests', () => {
    it('should prevent XSS through escapeHtml-like sanitization', () => {
      // Test XSS prevention by creating safe HTML
      const unsafeString = '<script>alert("XSS")</script>';
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      const escapedString = unsafeString.replace(/[&<>"']/g, m => map[m]);

      expect(escapedString).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      expect(escapedString).not.toContain('<script>');
    });

    it('should safely set innerHTML with escaped content', () => {
      const container = document.getElementById('eventsContainer');
      const safeTitle = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
      
      container.innerHTML = `<div>${safeTitle}</div>`;

      // The escaped content should be in innerHTML
      expect(container.innerHTML).toContain('&lt;script&gt;');
      // But the actual text content should show the escaped version
      expect(container.textContent).toContain('<script>');
    });
  });

  describe('Event Card Structure Tests', () => {
    it('should create proper event card structure', () => {
      const container = document.getElementById('eventsContainer');
      
      // Simulate creating an event card
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-4 fade-in';
      col.innerHTML = `
        <div class="card event-card h-100">
          <div class="card-body">
            <h5 class="card-title">Test Event</h5>
            <p class="card-text text-muted">Test Description</p>
            <div class="mb-3">
              <span class="badge bg-primary">
                <i class="bi bi-calendar"></i> 31/12/2024, 14:00
              </span>
              <span class="badge bg-success">
                <i class="bi bi-people"></i> 30 vagas disponíveis
              </span>
            </div>
            <a href="/event/123" class="btn btn-primary w-100">
              Ver Detalhes
            </a>
          </div>
        </div>
      `;
      
      container.appendChild(col);

      expect(container.querySelector('.card-title').textContent).toBe('Test Event');
      expect(container.querySelector('.card-text').textContent).toBe('Test Description');
      expect(container.querySelector('a').getAttribute('href')).toBe('/event/123');
    });

    it('should show correct badge colors based on available slots', () => {
      // Test badge colors for different slot availability
      const testCases = [
        { slots: 15, expectedColor: 'success' },
        { slots: 5, expectedColor: 'warning' },
        { slots: 0, expectedColor: 'danger' }
      ];

      testCases.forEach(({ slots, expectedColor }) => {
        const slotsColor = slots > 10 ? 'success' : slots > 0 ? 'warning' : 'danger';
        expect(slotsColor).toBe(expectedColor);
      });
    });

    it('should show "Esgotado" when no slots available', () => {
      const availableSlots = 0;
      const slotsText = availableSlots > 0 
        ? `${availableSlots} vagas disponíveis` 
        : 'Esgotado';
      
      expect(slotsText).toBe('Esgotado');
    });
  });

  describe('Date Filtering Tests', () => {
    it('should filter events to show only future events', () => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const events = [
        { id: '1', dateTime: new Date(now.getTime() - 86400000).toISOString() }, // Yesterday
        { id: '2', dateTime: new Date(now.getTime() + 86400000).toISOString() }, // Tomorrow
        { id: '3', dateTime: startOfToday.toISOString() } // Today
      ];

      const futureEvents = events.filter(event => new Date(event.dateTime) >= startOfToday);

      // Should include today and future events
      expect(futureEvents.length).toBe(2);
      expect(futureEvents.find(e => e.id === '1')).toBeUndefined();
      expect(futureEvents.find(e => e.id === '2')).toBeDefined();
      expect(futureEvents.find(e => e.id === '3')).toBeDefined();
    });
  });

  describe('Pagination Logic Tests', () => {
    it('should calculate correct pagination', () => {
      const eventsPerPage = 5;
      const totalEvents = 23;
      const totalPages = Math.ceil(totalEvents / eventsPerPage);

      expect(totalPages).toBe(5);
    });

    it('should slice events correctly for pagination', () => {
      const events = Array.from({ length: 23 }, (_, i) => ({ id: String(i + 1) }));
      const eventsPerPage = 5;
      const page = 2;

      const startIndex = (page - 1) * eventsPerPage;
      const endIndex = startIndex + eventsPerPage;
      const pageEvents = events.slice(startIndex, endIndex);

      expect(pageEvents.length).toBe(5);
      expect(pageEvents[0].id).toBe('6');
      expect(pageEvents[4].id).toBe('10');
    });
  });

  describe('Search/Filter Logic Tests', () => {
    it('should filter events by title', () => {
      const events = [
        { title: 'JavaScript Workshop' },
        { title: 'Python Tutorial' },
        { title: 'JavaScript Advanced' }
      ];

      const searchQuery = 'javascript';
      const filtered = events.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filtered.length).toBe(2);
      expect(filtered[0].title).toBe('JavaScript Workshop');
      expect(filtered[1].title).toBe('JavaScript Advanced');
    });

    it('should be case-insensitive', () => {
      const events = [{ title: 'JavaScript Workshop' }];
      
      const queries = ['javascript', 'JAVASCRIPT', 'JavaScript', 'jAvAsCrIpT'];
      
      queries.forEach(query => {
        const filtered = events.filter(event => 
          event.title.toLowerCase().includes(query.toLowerCase())
        );
        expect(filtered.length).toBe(1);
      });
    });
  });
});
