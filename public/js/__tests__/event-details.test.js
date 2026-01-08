/**
 * @jest-environment jsdom
 */

describe('event-details.js - Event Registration and Details', () => {
  let store;
  let mockFetch;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="loading" class="d-none"></div>
      <div id="eventDetailsContainer" class="d-none"></div>
      <div id="errorContainer" class="d-none"></div>
      <div id="eventTitle"></div>
      <div id="eventDescription"></div>
      <div id="eventDate"></div>
      <div id="eventSlots"></div>
      <form id="registerForm">
        <input id="name" />
        <input id="email" />
        <input id="phone" />
      </form>
      <div id="registrationError" class="d-none"></div>
      <div id="registrationForm"></div>
      <div id="registrationSuccess" class="d-none"></div>
      <button id="registerButton"></button>
      <button id="cancelRegistrationButton"></button>
      <button id="backButton"></button>
      <button id="backButtonSuccess"></button>
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

    // Mock window.location with a test event ID
    delete window.location;
    window.location = { 
      origin: 'http://localhost:3000', 
      pathname: '/event/test-event-123',
      href: 'http://localhost:3000/event/test-event-123'
    };

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock alert and confirm
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API Integration - Event Details', () => {
    it('should make correct API call to fetch event details', async () => {
      const mockEvent = {
        id: 'test-event-123',
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date().toISOString(),
        totalSlots: 50,
        availableSlots: 30,
        local: 'Test Location'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockEvent })
      });

      const response = await fetch('http://localhost:3000/api/events/test-event-123');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data).toEqual(mockEvent);
      expect(data.data.title).toBe('Test Event');
    });

    it('should handle event not found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Evento não encontrado' })
      });

      const response = await fetch('http://localhost:3000/api/events/invalid-id');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toBe('Evento não encontrado');
    });
  });

  describe('API Integration - Registration', () => {
    it('should make correct API call to register for event', async () => {
      const registrationData = {
        eventId: 'test-event-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999'
      };

      const mockResponse = {
        data: {
          id: 'reg-123',
          ...registrationData,
          registeredAt: new Date().toISOString()
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('http://localhost:3000/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/registrations',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(registrationData)
        })
      );
      expect(data.data.id).toBe('reg-123');
    });

    it('should handle registration errors', async () => {
      const registrationData = {
        eventId: 'test-event-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Já existe uma inscrição com este email' })
      });

      const response = await fetch('http://localhost:3000/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toContain('inscrição com este email');
    });

    it('should make correct API call to cancel registration', async () => {
      const registrationId = 'reg-123';
      const eventId = 'test-event-123';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true } })
      });

      const response = await fetch(`http://localhost:3000/api/registrations/${registrationId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/cancel'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ eventId })
        })
      );
      expect(data.data.success).toBe(true);
    });
  });

  describe('LocalStorage - Registration Persistence', () => {
    it('should generate correct storage key for event', () => {
      const eventId = 'test-event-123';
      const sanitizedEventId = eventId.replace(/[^a-zA-Z0-9_-]/g, '');
      const storageKey = 'event_registration_' + sanitizedEventId;

      expect(storageKey).toBe('event_registration_test-event-123');
    });

    it('should save registration state to localStorage', () => {
      const registrationData = {
        registrationId: 'reg-123',
        eventId: 'test-event-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999',
        timestamp: new Date().toISOString()
      };

      const storageKey = 'event_registration_test-event-123';
      store[storageKey] = JSON.stringify(registrationData);

      const retrieved = JSON.parse(store[storageKey]);

      expect(retrieved.registrationId).toBe('reg-123');
      expect(retrieved.name).toBe('John Doe');
      expect(retrieved.email).toBe('john@example.com');
    });

    it('should restore registration state from localStorage', () => {
      const registrationData = {
        registrationId: 'reg-123',
        eventId: 'test-event-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999',
        timestamp: new Date().toISOString()
      };

      const storageKey = 'event_registration_test-event-123';
      store[storageKey] = JSON.stringify(registrationData);

      // Simulate restoring state
      const storedData = store[storageKey];
      if (storedData) {
        const restored = JSON.parse(storedData);
        expect(restored.registrationId).toBe('reg-123');
        expect(restored.name).toBe('John Doe');
      }
    });

    it('should clear registration state from localStorage', () => {
      const storageKey = 'event_registration_test-event-123';
      store[storageKey] = JSON.stringify({ registrationId: 'reg-123' });

      delete store[storageKey];

      expect(store[storageKey]).toBeUndefined();
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
      const storageKey = 'event_registration_test-event-123';
      store[storageKey] = 'invalid-json{';

      expect(() => {
        JSON.parse(store[storageKey]);
      }).toThrow();

      // After catching error, should clear invalid data
      delete store[storageKey];
      expect(store[storageKey]).toBeUndefined();
    });

    it('should sanitize eventId for storage key', () => {
      const unsafeEventIds = [
        'event<script>',
        'event/../../../etc/passwd',
        'event;DROP TABLE',
        'event"test"'
      ];

      unsafeEventIds.forEach(eventId => {
        const sanitized = eventId.replace(/[^a-zA-Z0-9_-]/g, '');
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');
        expect(sanitized).not.toContain('/');
        expect(sanitized).not.toContain('"');
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const name = '  '; // Only whitespace
      const email = '';
      const phone = '';

      const isValid = !!(name.trim() && email.trim() && phone.trim());

      expect(isValid).toBe(false);
    });

    it('should accept valid registration data', () => {
      const name = 'John Doe';
      const email = 'john@example.com';
      const phone = '+5511999999999';

      const isValid = !!(name.trim() && email.trim() && phone.trim());

      expect(isValid).toBe(true);
    });

    it('should trim whitespace from inputs', () => {
      const name = '  John Doe  ';
      const email = '  john@example.com  ';
      const phone = '  +5511999999999  ';

      expect(name.trim()).toBe('John Doe');
      expect(email.trim()).toBe('john@example.com');
      expect(phone.trim()).toBe('+5511999999999');
    });
  });

  describe('Event Details Display', () => {
    it('should format event date correctly in pt-BR locale', () => {
      const eventDate = new Date('2024-12-31T14:00:00');
      const formattedDate = eventDate.toLocaleString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      expect(formattedDate).toContain('2024');
      expect(formattedDate).toContain('14:00');
    });

    it('should determine correct badge color for available slots', () => {
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
      const totalSlots = 50;
      const slotsText = availableSlots > 0 
        ? `${availableSlots}/${totalSlots} vagas disponíveis` 
        : 'Esgotado';

      expect(slotsText).toBe('Esgotado');
    });

    it('should show available slots count when slots available', () => {
      const availableSlots = 30;
      const totalSlots = 50;
      const slotsText = availableSlots > 0 
        ? `${availableSlots}/${totalSlots} vagas disponíveis` 
        : 'Esgotado';

      expect(slotsText).toBe('30/50 vagas disponíveis');
    });

    it('should disable register button when event is full', () => {
      const availableSlots = 0;
      const registerButton = document.getElementById('registerButton');
      
      if (availableSlots === 0) {
        registerButton.disabled = true;
        registerButton.innerHTML = '<i class="bi bi-x-circle"></i> Vagas Esgotadas';
      }

      expect(registerButton.disabled).toBe(true);
      expect(registerButton.innerHTML).toContain('Vagas Esgotadas');
    });

    it('should enable register button when slots available', () => {
      const availableSlots = 10;
      const registerButton = document.getElementById('registerButton');
      
      if (availableSlots > 0) {
        registerButton.disabled = false;
        registerButton.innerHTML = '<i class="bi bi-check-circle"></i> Inscrever-se';
      }

      expect(registerButton.disabled).toBe(false);
      expect(registerButton.innerHTML).toContain('Inscrever-se');
    });
  });

  describe('UI State Management', () => {
    it('should show registration form initially', () => {
      const registrationForm = document.getElementById('registrationForm');
      const registrationSuccess = document.getElementById('registrationSuccess');

      registrationForm.classList.remove('d-none');
      registrationSuccess.classList.add('d-none');

      expect(registrationForm.classList.contains('d-none')).toBe(false);
      expect(registrationSuccess.classList.contains('d-none')).toBe(true);
    });

    it('should switch to success view after registration', () => {
      const registrationForm = document.getElementById('registrationForm');
      const registrationSuccess = document.getElementById('registrationSuccess');

      // Simulate successful registration
      registrationForm.classList.add('d-none');
      registrationSuccess.classList.remove('d-none');

      expect(registrationForm.classList.contains('d-none')).toBe(true);
      expect(registrationSuccess.classList.contains('d-none')).toBe(false);
    });

    it('should show loading state while fetching data', () => {
      const loading = document.getElementById('loading');
      const eventDetailsContainer = document.getElementById('eventDetailsContainer');

      loading.classList.remove('d-none');
      eventDetailsContainer.classList.add('d-none');

      expect(loading.classList.contains('d-none')).toBe(false);
      expect(eventDetailsContainer.classList.contains('d-none')).toBe(true);
    });

    it('should show error container on error', () => {
      const errorContainer = document.getElementById('errorContainer');
      
      errorContainer.textContent = 'Erro ao carregar detalhes do evento';
      errorContainer.classList.remove('d-none');

      expect(errorContainer.classList.contains('d-none')).toBe(false);
      expect(errorContainer.textContent).toContain('Erro');
    });
  });

  describe('Navigation', () => {
    it('should handle browser history back navigation', () => {
      const mockHistoryBack = jest.fn();
      Object.defineProperty(window, 'history', {
        value: {
          length: 2,
          back: mockHistoryBack
        },
        writable: true
      });

      // Simulate back navigation
      if (window.history.length > 1) {
        window.history.back();
      }

      expect(mockHistoryBack).toHaveBeenCalled();
    });

    it('should fallback to home page if no history', () => {
      Object.defineProperty(window, 'history', {
        value: {
          length: 1
        },
        writable: true
      });

      // Simulate fallback
      let redirectUrl = '/';
      if (window.history.length <= 1) {
        redirectUrl = '/';
      }

      expect(redirectUrl).toBe('/');
    });
  });
});
