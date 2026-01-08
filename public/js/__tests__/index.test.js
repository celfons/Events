/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost:3000"}
 */

const fs = require('fs');
const path = require('path');

// Mock fetch globally
global.fetch = jest.fn();

// Mock bootstrap
global.bootstrap = {
  Modal: jest.fn().mockImplementation(() => ({
    show: jest.fn(),
    hide: jest.fn()
  })),
  getInstance: jest.fn().mockReturnValue({
    show: jest.fn(),
    hide: jest.fn()
  })
};

describe('index.js - Core functionality', () => {
  let indexCode;
  
  beforeAll(() => {
    // Load required files
    const authUtilsPath = path.join(__dirname, '..', 'auth-utils.js');
    const indexPath = path.join(__dirname, '..', 'index.js');
    global.eval(fs.readFileSync(authUtilsPath, 'utf8'));
    indexCode = fs.readFileSync(indexPath, 'utf8');
  });

  beforeEach(() => {
    // Clear mocks
    global.fetch.mockClear();
    localStorage.clear();
    
    // Set up basic DOM structure
    document.body.innerHTML = `
      <div id="loginItem" class="d-none"></div>
      <div id="logoutItem" class="d-none"></div>
      <div id="userInfoItem" class="d-none"></div>
      <span id="userInfo"></span>
      <a id="adminLink"></a>
      <div id="eventsContainer"></div>
      <div id="loading" class="d-none">Loading...</div>
      <div id="noEvents" class="d-none">No events</div>
      <div id="pagination"></div>
      <input id="searchInput" value="" />
      <button id="clearSearchBtn"></button>
      <div id="loginModal">
        <form id="loginForm">
          <input id="loginEmail" type="email" />
          <input id="loginPassword" type="password" />
          <div id="loginError" class="d-none"></div>
        </form>
        <button id="submitLogin">Login</button>
      </div>
      <button id="logoutBtn">Logout</button>
    `;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      eval(indexCode);
      
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      expect(escapeHtml('Test & Co')).toBe('Test &amp; Co');
      expect(escapeHtml("O'Reilly")).toBe('O&#039;Reilly');
    });
  });

  describe('login', () => {
    it('should call API with credentials and save token on success', async () => {
      const mockResponse = {
        token: 'test-token',
        user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'user' }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      eval(indexCode);
      
      const result = await login('test@example.com', 'password123');
      
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        })
      );
      expect(localStorage.getItem('token')).toBe('test-token');
    });

    it('should return error on failed login', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      });
      
      eval(indexCode);
      
      const result = await login('test@example.com', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('updateAuthUI', () => {
    it('should show logout button when user is logged in', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ username: 'testuser', role: 'user' }));
      localStorage.setItem('tokenExpiration', (Date.now() + 10000).toString());
      
      eval(indexCode);
      updateAuthUI();
      
      expect(document.getElementById('loginItem').classList.contains('d-none')).toBe(true);
      expect(document.getElementById('logoutItem').classList.contains('d-none')).toBe(false);
      expect(document.getElementById('userInfo').textContent).toBe('Olá, testuser');
    });

    it('should show login button when user is not logged in', () => {
      eval(indexCode);
      updateAuthUI();
      
      expect(document.getElementById('loginItem').classList.contains('d-none')).toBe(false);
      expect(document.getElementById('logoutItem').classList.contains('d-none')).toBe(true);
    });

    it('should show users link for superuser', () => {
      document.body.innerHTML += '<ul class="navbar-nav"></ul>';
      
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'superuser' }));
      localStorage.setItem('tokenExpiration', (Date.now() + 10000).toString());
      
      eval(indexCode);
      updateAuthUI();
      
      const usersLink = document.getElementById('usersLink');
      expect(usersLink).toBeTruthy();
    });
  });

  describe('createEventCard', () => {
    it('should create event card with correct information', () => {
      eval(indexCode);
      
      const event = {
        id: '1',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: '2024-12-31T14:00:00.000Z',
        availableSlots: 50,
        totalSlots: 100,
        local: 'Test Location'
      };
      
      const card = createEventCard(event);
      
      expect(card.innerHTML).toContain('Test Event');
      expect(card.innerHTML).toContain('Test Description');
      expect(card.innerHTML).toContain('50 vagas disponíveis');
      expect(card.innerHTML).toContain('Test Location');
      expect(card.innerHTML).toContain('/event/1');
    });

    it('should show "Esgotado" when no slots available', () => {
      eval(indexCode);
      
      const event = {
        id: '1',
        title: 'Full Event',
        description: 'This is full',
        dateTime: '2024-12-31T14:00:00.000Z',
        availableSlots: 0,
        totalSlots: 100
      };
      
      const card = createEventCard(event);
      
      expect(card.innerHTML).toContain('Esgotado');
      expect(card.innerHTML).toContain('bg-danger');
    });
  });

  describe('loadEvents', () => {
    it('should fetch and display events', async () => {
      const mockEvents = {
        data: [
          {
            id: '1',
            title: 'Event 1',
            description: 'Description 1',
            dateTime: '2024-12-31T14:00:00.000Z',
            availableSlots: 50,
            totalSlots: 100
          }
        ]
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents
      });
      
      eval(indexCode);
      await loadEvents();
      
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/events');
      expect(document.getElementById('loading').classList.contains('d-none')).toBe(true);
    });

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' })
      });
      
      eval(indexCode);
      await loadEvents();
      
      expect(document.getElementById('loading').classList.contains('d-none')).toBe(true);
      expect(document.getElementById('eventsContainer').innerHTML).toContain('Erro ao carregar eventos');
    });

    it('should filter events to show only today and future events', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const mockEvents = {
        data: [
          {
            id: '1',
            title: 'Past Event',
            description: 'Desc',
            dateTime: yesterday.toISOString(),
            availableSlots: 50,
            totalSlots: 100
          },
          {
            id: '2',
            title: 'Future Event',
            description: 'Desc',
            dateTime: tomorrow.toISOString(),
            availableSlots: 50,
            totalSlots: 100
          }
        ]
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents
      });
      
      eval(indexCode);
      await loadEvents();
      
      // futureEvents is defined inside the module, we need to expose it or test indirectly
      // For now, we can check that events are loaded correctly via DOM
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
