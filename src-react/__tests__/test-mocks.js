/**
 * Shared mock setup for React component tests
 */
import React from 'react';

// Mock hooks
export const mockUseAuth = () => ({
  useAuth: jest.fn(() => ({
    user: { username: 'testuser', userId: '123', role: 'user' },
    logout: jest.fn()
  }))
});

export const mockUseToast = () => ({
  useToast: jest.fn(() => ({
    toasts: [],
    showSuccess: jest.fn(),
    showError: jest.fn(),
    removeToast: jest.fn()
  }))
});

// Mock components
export const MockNavbar = () => <div data-testid="navbar">Navbar</div>;
export const MockFooter = () => <div data-testid="footer">Footer</div>;
export const MockToast = () => <div data-testid="toast">Toast</div>;
export const MockLoginModal = () => <div data-testid="login-modal">LoginModal</div>;

// Setup all common mocks
export function setupAllCommonMocks() {
  jest.mock('../hooks/useAuth', () => mockUseAuth());
  jest.mock('../hooks/useToast', () => mockUseToast());
  jest.mock('../components/Navbar', () => ({ default: MockNavbar }));
  jest.mock('../components/Footer', () => ({ default: MockFooter }));
  jest.mock('../components/Toast', () => ({ default: MockToast }));
  jest.mock('../utils/helpers', () => ({
    API_URL: 'http://localhost:3000'
  }));
}
