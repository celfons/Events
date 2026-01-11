/**
 * @jest-environment jsdom
 *
 * Common mock setup for all React component tests
 * This file should be imported at the top of test files to set up mocks
 */
import React from 'react';

// Mock hooks - useAuth
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { username: 'testuser', userId: '123', role: 'user' },
    login: jest.fn(),
    logout: jest.fn()
  }))
}));

// Mock hooks - useToast
jest.mock('../hooks/useToast', () => ({
  useToast: jest.fn(() => ({
    toasts: [],
    showSuccess: jest.fn(),
    showError: jest.fn(),
    removeToast: jest.fn()
  }))
}));

// Mock components - Navbar
jest.mock('../components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

// Mock components - Footer
jest.mock('../components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

// Mock components - Toast
jest.mock('../components/Toast', () => {
  return function MockToast() {
    return <div data-testid="toast">Toast</div>;
  };
});

// Mock components - LoginModal
jest.mock('../components/LoginModal', () => {
  return function MockLoginModal() {
    return <div data-testid="login-modal">LoginModal</div>;
  };
});

// Mock utilities - helpers
jest.mock('../utils/helpers', () => ({
  API_URL: 'http://localhost:3000'
}));

// Mock utilities - auth
jest.mock('../utils/auth', () => ({
  getToken: jest.fn(() => 'fake-token')
}));

// Mock utilities - apiClient
jest.mock('../utils/apiClient', () => ({
  fetchWithTracing: jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [] })
    })
  )
}));
