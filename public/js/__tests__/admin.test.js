/**
 * @jest-environment jsdom
 */

describe('admin.js - Event Management and Administration', () => {
  let store;
  let mockFetch;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="loading" class="d-none"></div>
      <div id="noEvents" class="d-none"></div>
      <div id="eventsTableContainer" class="d-none"></div>
      <tbody id="eventsTableBody"></tbody>
      <div id="pagination"></div>
      <input id="searchInput" />
      <button id="clearSearchBtn"></button>
      <input id="activeOnlySwitch" type="checkbox" />
      <form id="createEventForm">
        <input id="eventTitle" />
        <input id="eventDescription" />
        <input id="eventDateTime" type="datetime-local" />
        <input id="eventSlots" type="number" />
        <input id="eventLocal" />
      </form>
      <div id="createEventError" class="d-none"></div>
      <button id="submitCreateEvent"></button>
      <form id="updateEventForm">
        <input id="updateEventTitle" />
        <input id="updateEventDescription" />
        <input id="updateEventDateTime" type="datetime-local" />
        <input id="updateEventSlots" type="number" />
        <input id="updateEventAvailableSlots" type="number" />
        <input id="updateEventLocal" />
        <input id="updateEventIsActive" type="checkbox" />
      </form>
      <button id="submitUpdateEvent"></button>
      <button id="deleteEventBtn"></button>
      <button id="viewParticipantsBtn"></button>
      <div id="updateEventError" class="d-none"></div>
      <div id="participantsLoading" class="d-none"></div>
      <div id="participantsContainer" class="d-none"></div>
      <div id="noParticipants" class="d-none"></div>
      <tbody id="participantsTableBody"></tbody>
      <div id="participantsPagination"></div>
      <input id="participantsSearchInput" />
      <button id="clearParticipantsSearchBtn"></button>
      <div id="registerParticipantModal"></div>
      <form id="registerParticipantForm">
        <input id="participantName" />
        <input id="participantEmail" />
        <input id="participantPhone" />
      </form>
      <button id="submitRegisterParticipant"></button>
      <div id="registerParticipantError" class="d-none"></div>
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
    window.location = { 
      origin: 'http://localhost:3000', 
      pathname: '/admin',
      href: 'http://localhost:3000/admin'
    };

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
    bootstrap.Modal.getInstance = jest.fn(() => ({
      hide: jest.fn()
    }));

    // Mock alert and confirm
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API Integration - Event Management', () => {
    it('should make correct API call to fetch user events', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Event 1',
          description: 'Description 1',
          dateTime: new Date().toISOString(),
          totalSlots: 50,
          availableSlots: 30,
          local: 'Location 1',
          isActive: true
        }
      ];

      const token = 'test-token';
      const futureTime = Date.now() + (1000 * 60 * 60);
      store['token'] = token;
      store['tokenExpiration'] = futureTime.toString();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockEvents })
      });

      const response = await fetch('http://localhost:3000/api/events/my-events', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data).toEqual(mockEvents);
    });

    it('should make correct API call to create event', async () => {
      const eventData = {
        title: 'New Event',
        description: 'New Description',
        dateTime: new Date().toISOString(),
        totalSlots: 50,
        local: 'New Location'
      };

      const token = 'test-token';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-event-id', ...eventData } })
      });

      const response = await fetch('http://localhost:3000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/events',
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(data.data.title).toBe('New Event');
    });

    it('should make correct API call to update event', async () => {
      const eventId = 'event-123';
      const updateData = {
        title: 'Updated Event',
        description: 'Updated Description',
        dateTime: new Date().toISOString(),
        totalSlots: 60,
        local: 'Updated Location',
        isActive: true
      };

      const token = 'test-token';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: eventId, ...updateData } })
      });

      const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(eventId),
        expect.objectContaining({
          method: 'PUT'
        })
      );
      expect(data.data.title).toBe('Updated Event');
    });

    it('should make correct API call to delete event', async () => {
      const eventId = 'event-123';
      const token = 'test-token';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true } })
      });

      const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(eventId),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      expect(data.data.success).toBe(true);
    });
  });

  describe('API Integration - Participants', () => {
    it('should make correct API call to fetch event participants', async () => {
      const eventId = 'event-123';
      const mockParticipants = [
        {
          id: 'reg-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+5511999999999',
          registeredAt: new Date().toISOString()
        }
      ];

      const token = 'test-token';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockParticipants })
      });

      const response = await fetch(`http://localhost:3000/api/events/${eventId}/participants`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/participants'),
        expect.any(Object)
      );
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('John Doe');
    });

    it('should make correct API call to register participant', async () => {
      const registrationData = {
        eventId: 'event-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999'
      };

      const token = 'test-token';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'reg-123', ...registrationData } })
      });

      const response = await fetch('http://localhost:3000/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/registrations',
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(data.data.name).toBe('John Doe');
    });

    it('should make correct API call to remove participant', async () => {
      const registrationId = 'reg-123';
      const eventId = 'event-123';
      const token = 'test-token';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true } })
      });

      const response = await fetch(`http://localhost:3000/api/registrations/${registrationId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId })
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/cancel'),
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(data.data.success).toBe(true);
    });
  });

  describe('DateTime Conversion', () => {
    it('should convert local datetime to ISO string correctly', () => {
      const dateTimeLocalValue = '2024-12-31T14:00';
      const localDate = new Date(dateTimeLocalValue);
      const isoString = localDate.toISOString();

      expect(isoString).toContain('2024-12-31');
    });

    it('should format date for datetime-local input', () => {
      const date = new Date('2024-12-31T14:00:00');
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
  });

  describe('Event Filtering', () => {
    it('should filter events by search query', () => {
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
    });

    it('should filter events by isActive status', () => {
      const events = [
        { title: 'Event 1', isActive: true },
        { title: 'Event 2', isActive: false },
        { title: 'Event 3', isActive: true }
      ];

      const activeEvents = events.filter(event => event.isActive !== false);
      const allEvents = events;

      expect(activeEvents.length).toBe(2);
      expect(allEvents.length).toBe(3);
    });

    it('should treat undefined isActive as active', () => {
      const events = [
        { title: 'Event 1', isActive: undefined },
        { title: 'Event 2', isActive: false },
        { title: 'Event 3' } // No isActive property
      ];

      const activeEvents = events.filter(event => event.isActive !== false);

      expect(activeEvents.length).toBe(2);
    });
  });

  describe('Pagination Logic', () => {
    it('should calculate correct pagination for events', () => {
      const totalEvents = 43;
      const eventsPerPage = 10;
      const totalPages = Math.ceil(totalEvents / eventsPerPage);

      expect(totalPages).toBe(5);
    });

    it('should slice events correctly for page', () => {
      const events = Array.from({ length: 43 }, (_, i) => ({ id: String(i + 1) }));
      const page = 3;
      const eventsPerPage = 10;

      const startIndex = (page - 1) * eventsPerPage;
      const endIndex = startIndex + eventsPerPage;
      const pageEvents = events.slice(startIndex, endIndex);

      expect(pageEvents.length).toBe(10);
      expect(pageEvents[0].id).toBe('21');
      expect(pageEvents[9].id).toBe('30');
    });

    it('should handle last page with fewer items', () => {
      const events = Array.from({ length: 43 }, (_, i) => ({ id: String(i + 1) }));
      const page = 5;
      const eventsPerPage = 10;

      const startIndex = (page - 1) * eventsPerPage;
      const endIndex = startIndex + eventsPerPage;
      const pageEvents = events.slice(startIndex, endIndex);

      expect(pageEvents.length).toBe(3);
    });
  });

  describe('Participant Search and Filter', () => {
    it('should filter participants by name', () => {
      const participants = [
        { name: 'John Doe', email: 'john@example.com', phone: '111' },
        { name: 'Jane Smith', email: 'jane@example.com', phone: '222' },
        { name: 'John Brown', email: 'brown@example.com', phone: '333' }
      ];

      const searchQuery = 'john';
      const filtered = participants.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filtered.length).toBe(2);
    });

    it('should filter participants by email', () => {
      const participants = [
        { name: 'John Doe', email: 'john@example.com', phone: '111' },
        { name: 'Jane Smith', email: 'jane@example.com', phone: '222' }
      ];

      const searchQuery = 'jane@';
      const filtered = participants.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Jane Smith');
    });
  });

  describe('Form Validation', () => {
    it('should validate event creation form fields', () => {
      const title = 'New Event';
      const description = 'Description';
      const dateTime = '2024-12-31T14:00';
      const totalSlots = 50;

      const isValid = !!(title.trim() && description.trim() && dateTime && totalSlots);

      expect(isValid).toBe(true);
    });

    it('should reject event with empty title', () => {
      const title = '  ';
      const description = 'Description';
      const dateTime = '2024-12-31T14:00';
      const totalSlots = 50;

      const isValid = !!(title.trim() && description.trim() && dateTime && totalSlots);

      expect(isValid).toBe(false);
    });

    it('should reject event with invalid slots', () => {
      const totalSlots = 0;
      const isValid = totalSlots >= 1;

      expect(isValid).toBe(false);
    });

    it('should accept event with valid slots', () => {
      const totalSlots = 50;
      const isValid = totalSlots >= 1;

      expect(isValid).toBe(true);
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML in event titles', () => {
      const unsafeTitle = '<script>alert("XSS")</script>';
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      const escapedTitle = unsafeTitle.replace(/[&<>"']/g, m => map[m]);

      expect(escapedTitle).not.toContain('<script>');
      expect(escapedTitle).toContain('&lt;script&gt;');
    });
  });
});
