# React UI Refactoring

This document describes the React refactoring of the Events platform UI.

## Overview

The UI has been refactored from vanilla JavaScript to React while maintaining:
- ✅ **Same API contracts** - No changes to backend APIs
- ✅ **Same behavior** - All existing functionality preserved
- ✅ **Simple implementation** - Using standard React patterns
- ✅ **Tests included** - Component and hook tests with Jest and React Testing Library

## Project Structure

```
src-react/
├── components/          # Reusable React components
│   ├── Navbar.jsx      # Main navigation bar
│   ├── Footer.jsx      # Page footer
│   ├── Toast.jsx       # Toast notifications
│   └── LoginModal.jsx  # Login modal dialog
├── hooks/              # Custom React hooks
│   ├── useAuth.js      # Authentication hook
│   └── useToast.js     # Toast notifications hook
├── pages/              # Main page components
│   ├── Index.jsx       # Events list page (COMPLETED)
│   ├── Admin.jsx       # Admin dashboard (TODO)
│   ├── EventDetails.jsx # Event details page (TODO)
│   └── Users.jsx       # User management page (TODO)
├── utils/              # Utility functions
│   ├── auth.js         # Auth helpers (token management)
│   └── helpers.js      # General helpers
└── __tests__/          # Tests for components and hooks
```

## Build System

- **Webpack** - Module bundler
- **Babel** - JSX transpilation
- **React 18** - UI framework

### Build Commands

```bash
# Development build
npm run build:react:dev

# Production build
npm run build:react
```

### Build Output

Compiled bundles are output to `public/js/react-build/`:
- `index.bundle.js` - Events list page
- `admin.bundle.js` - Admin page
- `event-details.bundle.js` - Event details page
- `users.bundle.js` - User management page

## HTML Pages

React-powered HTML files are in `public/views/`:
- `index-react.html` - Uses `index.bundle.js`
- `admin-react.html` - Uses `admin.bundle.js` (TODO)
- `event-details-react.html` - Uses `event-details.bundle.js` (TODO)
- `users-react.html` - Uses `users.bundle.js` (TODO)

## Components

### Navbar
Navigation bar component with:
- Dynamic user authentication state
- Role-based menu items (superuser sees Users link)
- Login/Logout buttons

### Footer
Simple footer with copyright information.

### Toast
Bootstrap-based toast notifications component supporting:
- Success, Error, Info, Warning types
- Auto-dismiss after configurable duration
- Multiple toasts displayed simultaneously

### LoginModal
Bootstrap modal for user authentication:
- Email and password inputs
- Form validation
- Error display
- Loading state during login

## Custom Hooks

### useAuth
Manages authentication state:
- `token` - Current auth token
- `user` - Current user object
- `isAuthenticated` - Boolean auth status
- `login(email, password)` - Login function
- `logout()` - Logout function

### useToast
Manages toast notifications:
- `toasts` - Array of active toasts
- `showToast(message, type, duration)` - Show a toast
- `showSuccess(message)` - Show success toast
- `showError(message)` - Show error toast
- `showInfo(message)` - Show info toast
- `showWarning(message)` - Show warning toast
- `removeToast(id)` - Remove a toast

## Testing

Tests use Jest and React Testing Library:

```bash
# Run all tests
npm test

# Run only React tests
npm test -- src-react/__tests__

# Watch mode
npm test:watch
```

### Test Coverage

- ✅ Navbar component (5 tests)
- ✅ Footer component (1 test)
- ✅ useToast hook (3 tests)

## Migration Status

### Completed ✅
- [x] React infrastructure setup
- [x] Webpack + Babel configuration
- [x] Shared components (Navbar, Footer, Toast, LoginModal)
- [x] Custom hooks (useAuth, useToast)
- [x] Events list page (Index.jsx)
- [x] Component tests
- [x] Build system

### In Progress 🔄
- [ ] Admin page (Admin.jsx)
- [ ] Event details page (EventDetails.jsx)
- [ ] Users page (Users.jsx)

### Future Improvements 💡
- [ ] Code splitting for better performance
- [ ] React Router for SPA navigation
- [ ] More comprehensive test coverage
- [ ] TypeScript migration
- [ ] Storybook for component documentation

## Development Guidelines

1. **Component Structure**: Follow functional component pattern with hooks
2. **State Management**: Use React hooks (useState, useEffect, etc.)
3. **Styling**: Continue using Bootstrap 5 classes
4. **API Calls**: Use native fetch API
5. **Error Handling**: Show user-friendly error messages via toasts
6. **Testing**: Write tests for new components and hooks

## API Integration

All API calls use the existing backend endpoints:
- `GET /api/events` - List events
- `GET /api/events/:id` - Get event details
- `POST /api/auth/login` - User login
- `POST /api/events` - Create event (requires auth)
- `PUT /api/events/:id` - Update event (requires auth)
- `DELETE /api/events/:id` - Delete event (requires auth)
- And more...

## Browser Compatibility

The React implementation targets modern browsers supporting:
- ES6+ JavaScript
- Fetch API
- LocalStorage
- Bootstrap 5

## Notes

- The original vanilla JS files remain in `public/js/` for reference
- Both versions can coexist during the migration period
- The React version is served when routes point to `-react.html` files
- No backend changes are required for the React migration
