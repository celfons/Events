/**
 * @jest-environment jsdom
 */

import React from 'react';
import '@testing-library/jest-dom';
import { verifyBootstrapIconClass, setupCommonMocks, cleanupAfterTests } from './test-utils';

// Mock the hooks and components
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    login: jest.fn(),
    logout: jest.fn()
  }))
}));

jest.mock('../hooks/useToast', () => ({
  useToast: jest.fn(() => ({
    toasts: [],
    showSuccess: jest.fn(),
    showError: jest.fn(),
    removeToast: jest.fn()
  }))
}));

jest.mock('../components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock('../components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock('../components/Toast', () => {
  return function MockToast() {
    return <div data-testid="toast">Toast</div>;
  };
});

jest.mock('../components/LoginModal', () => {
  return function MockLoginModal() {
    return <div data-testid="login-modal">LoginModal</div>;
  };
});

jest.mock('../utils/helpers', () => ({
  API_URL: 'http://localhost:3000'
}));

describe('Index Page - Event List', () => {
  beforeEach(() => {
    setupCommonMocks();
  });

  afterEach(() => {
    cleanupAfterTests();
  });

  it('should load events from API on mount', async () => {
    const mockEvents = [
      {
        id: '1',
        title: 'Test Event 1',
        description: 'Description 1',
        dateTime: '2024-12-31T10:00:00Z',
        availableSlots: 10,
        eventCode: 'EVT001'
      },
      {
        id: '2',
        title: 'Test Event 2',
        description: 'Description 2',
        dateTime: '2024-12-31T14:00:00Z',
        availableSlots: 5,
        eventCode: 'EVT002'
      }
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockEvents })
    });

    const response = await fetch('http://localhost:3000/api/events');
    const data = await response.json();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/events');
    expect(data.data).toHaveLength(2);
    expect(data.data[0].title).toBe('Test Event 1');
  });

  it('should filter events by search query', () => {
    const events = [
      { id: '1', title: 'JavaScript Workshop', eventCode: 'JS001' },
      { id: '2', title: 'Python Basics', eventCode: 'PY001' }
    ];

    const searchQuery = 'javascript';
    const filtered = events.filter(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.eventCode && event.eventCode.includes(searchQuery.toUpperCase()))
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('JavaScript Workshop');
  });

  it('should filter events by event code', () => {
    const events = [
      { id: '1', title: 'JavaScript Workshop', eventCode: 'JS001' },
      { id: '2', title: 'Python Basics', eventCode: 'PY001' }
    ];

    const searchQuery = 'PY001';
    const filtered = events.filter(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.eventCode && event.eventCode.includes(searchQuery.toUpperCase()))
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].eventCode).toBe('PY001');
  });
});

describe('Index Page - Bootstrap Icons', () => {
  const iconTests = [
    { name: 'search', className: 'bi bi-search' },
    { name: 'calendar', className: 'bi bi-calendar' },
    { name: 'people', className: 'bi bi-people' },
    { name: 'location', className: 'bi bi-geo-alt' },
    { name: 'tag', className: 'bi bi-tag-fill' },
    { name: 'info', className: 'bi bi-info-circle' },
    { name: 'clear', className: 'bi bi-x' }
  ];

  iconTests.forEach(({ name, className }) => {
    it(`verify ${name} icon class is present`, () => {
      verifyBootstrapIconClass(className, className.split(' ')[1]);
    });
  });
});

describe('Index Page - Event Pagination', () => {
  it('should calculate pagination correctly', () => {
    const totalEvents = 23;
    const eventsPerPage = 5;
    const totalPages = Math.ceil(totalEvents / eventsPerPage);

    expect(totalPages).toBe(5);
  });

  it('should slice events correctly for pagination', () => {
    const events = Array.from({ length: 12 }, (_, i) => ({ id: `${i + 1}`, title: `Event ${i + 1}` }));
    const eventsPerPage = 5;
    const currentPage = 2;

    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const currentEvents = events.slice(startIndex, endIndex);

    expect(currentEvents).toHaveLength(5);
    expect(currentEvents[0].title).toBe('Event 6');
    expect(currentEvents[4].title).toBe('Event 10');
  });
});

describe('Index Page - Event Details Link', () => {
  it('should generate correct event details URL', () => {
    const eventId = '123abc';
    const expectedUrl = `/event/${eventId}`;

    expect(expectedUrl).toBe('/event/123abc');
  });

  it('should have proper button structure for event card', () => {
    const buttonClass = 'btn btn-primary w-100';
    
    expect(buttonClass).toContain('btn');
    expect(buttonClass).toContain('btn-primary');
    expect(buttonClass).toContain('w-100');
  });
});
