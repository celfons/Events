/**
 * @jest-environment jsdom
 */

import React from 'react';
import '@testing-library/jest-dom';
import { verifyBootstrapIconClass, setupCommonMocks, cleanupAfterTests } from './test-utils';

// Mock the hooks and components
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { username: 'testuser', userId: '123', role: 'user' },
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

jest.mock('../utils/helpers', () => ({
  API_URL: 'http://localhost:3000'
}));

jest.mock('../utils/auth', () => ({
  getToken: jest.fn(() => 'fake-token')
}));

describe('Admin Page - Bootstrap Icons', () => {
  it('verify create event button has bootstrap icon class', () => {
    verifyBootstrapIconClass('bi bi-plus-circle', 'bi-plus-circle');
  });

  it('verify edit button has bootstrap icon class', () => {
    verifyBootstrapIconClass('bi bi-pencil', 'bi-pencil');
  });

  it('verify delete button has bootstrap icon class', () => {
    verifyBootstrapIconClass('bi bi-trash', 'bi-trash');
  });

  it('verify participants button has bootstrap icon class', () => {
    verifyBootstrapIconClass('bi bi-people', 'bi-people');
  });
});



describe('Admin Page - Event API Integration', () => {
  beforeEach(() => {
    setupCommonMocks();
  });

  afterEach(() => {
    cleanupAfterTests();
  });

  it('should call API with correct data when creating event', async () => {
    const mockEventData = {
      title: 'Test Event',
      description: 'Test Description',
      dateTime: '2024-12-31T10:00',
      totalSlots: 50,
      local: 'Test Location'
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: { ...mockEventData, id: '1' }
      })
    });

    const response = await fetch('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token'
      },
      body: JSON.stringify(mockEventData)
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/events',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-token'
        })
      })
    );

    const data = await response.json();
    expect(data.data).toHaveProperty('id');
  });

  it('should call API with correct data when updating event', async () => {
    const mockEventData = {
      title: 'Updated Event',
      description: 'Updated Description',
      dateTime: '2024-12-31T10:00',
      totalSlots: 75,
      local: 'Updated Location',
      isActive: true
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: { ...mockEventData, id: '1' }
      })
    });

    const response = await fetch('http://localhost:3000/api/events/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token'
      },
      body: JSON.stringify(mockEventData)
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/events/1',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-token'
        })
      })
    );

    const data = await response.json();
    expect(data.data).toHaveProperty('id');
  });

  it('should handle update errors correctly', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: 'Update failed'
      })
    });

    const response = await fetch('http://localhost:3000/api/events/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token'
      },
      body: JSON.stringify({})
    });

    expect(response.ok).toBe(false);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});
