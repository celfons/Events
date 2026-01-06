# Authentication and Authorization Guide

## Overview

This application implements JWT-based authentication and role-based authorization with granular permissions. The system ensures that:

1. Users can only see, update, and delete their own events
2. The main page displays all events from all users (public access)
3. User and group management (CRUD operations) are restricted to superusers only

## Architecture

### Components

- **User Entity**: Domain entity representing a user with username, email, password, and role
- **JWT Tokens**: JSON Web Tokens for stateless authentication
- **Middleware**: Authentication and authorization middleware for route protection
- **Use Cases**: Business logic for login, register, and user management
- **Controllers**: HTTP handlers for authentication and user management endpoints

### Roles

- **user**: Regular user who can create, update, and delete only their own events
- **superuser**: Administrator who can manage all users and has full system access

## API Endpoints

### Authentication

#### Register a New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "createdAt": "2024-01-01T10:00:00.000Z"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Events (Protected Routes)

#### Create Event (Requires Authentication)
```http
POST /api/events
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Workshop de Node.js",
  "description": "Aprenda Node.js do zero",
  "dateTime": "2024-12-31T14:00:00",
  "totalSlots": 50
}
```

The event will be automatically associated with the authenticated user.

#### Update Event (Only Owner)
```http
PUT /api/events/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Workshop de Node.js Avançado",
  "totalSlots": 100
}
```

Only the user who created the event can update it.

#### Delete Event (Only Owner)
```http
DELETE /api/events/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

Only the user who created the event can delete it.

#### List Events (Public)
```http
GET /api/events
```

No authentication required. Returns all events from all users.

### User Management (Superuser Only)

#### List All Users
```http
GET /api/users
Authorization: Bearer SUPERUSER_JWT_TOKEN
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer SUPERUSER_JWT_TOKEN
Content-Type: application/json

{
  "username": "newusername",
  "email": "newemail@example.com",
  "role": "superuser"
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer SUPERUSER_JWT_TOKEN
```

## Setup

### 1. Environment Variables

Add to your `.env` file:
```env
JWT_SECRET=your-strong-random-secret-key
```

⚠️ **Important**: 
- Use a strong, random secret key in production (at least 32 characters)
- Never commit the `.env` file to version control
- The application will fail to start if JWT_SECRET is not set (security by default)

You can generate a secure secret key using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Create Initial Superuser

Set the superuser credentials via environment variables:
```bash
export SUPERUSER_USERNAME="admin"
export SUPERUSER_EMAIL="admin@example.com"
export SUPERUSER_PASSWORD="YourSecurePassword123!"
```

Then run:
```bash
npm run create-superuser
```

⚠️ **Security Best Practices**:
- Use a strong password (minimum 6 characters, recommended 12+)
- Never use default passwords like "admin123"
- The script requires SUPERUSER_PASSWORD to be set as an environment variable
- Store credentials securely (e.g., password manager, secrets vault)

## Authentication Flow

### For Web/Mobile Applications

1. **User Registration**:
   - Send POST request to `/api/auth/register` with user details
   - User is created with role "user" by default

2. **User Login**:
   - Send POST request to `/api/auth/login` with email and password
   - Receive JWT token and user information
   - Store token securely (localStorage for web, secure storage for mobile)

3. **Making Authenticated Requests**:
   - Include token in Authorization header: `Bearer YOUR_JWT_TOKEN`
   - Token is valid for 24 hours

4. **Token Expiration**:
   - When token expires, user must login again
   - Consider implementing refresh tokens for better UX

### Example: Creating an Event

```javascript
// After login, you have a token
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Create an event
const response = await fetch('http://localhost:3000/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'My Event',
    description: 'Event description',
    dateTime: '2024-12-31T14:00:00',
    totalSlots: 50
  })
});

const event = await response.json();
console.log('Event created:', event);
```

## Security Considerations

### Password Security
- Passwords are hashed using bcrypt with 10 salt rounds
- Never store plain text passwords
- Minimum password length: 6 characters (recommended 12+)
- No default passwords in production

### Token Security
- Tokens expire after 24 hours
- Use HTTPS in production to prevent token interception
- Store tokens securely on the client side
- JWT_SECRET must be set in environment variables (application fails if not set)
- Never expose JWT_SECRET in client code

### Authorization
- Every protected route validates the token
- Ownership checks are performed at the use case level
- Superuser role is strictly controlled

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired token."
}
```

```json
{
  "error": "You do not have permission to update this event"
}
```

```json
{
  "error": "Access denied. Superuser role required."
}
```

## Testing

Run the test suite:
```bash
npm test
```

Tests cover:
- User entity behavior
- Login use case (valid/invalid credentials, missing fields)
- Register use case (validation, duplicate detection)
- All authentication and authorization scenarios

## Integration with Frontend

### HTML/JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Events Platform</title>
</head>
<body>
  <div id="login-form">
    <h2>Login</h2>
    <input type="email" id="email" placeholder="Email">
    <input type="password" id="password" placeholder="Password">
    <button onclick="login()">Login</button>
  </div>

  <div id="app" style="display: none;">
    <h2>Create Event</h2>
    <input type="text" id="title" placeholder="Event Title">
    <textarea id="description" placeholder="Description"></textarea>
    <input type="datetime-local" id="dateTime">
    <input type="number" id="totalSlots" placeholder="Total Slots">
    <button onclick="createEvent()">Create Event</button>
    <button onclick="logout()">Logout</button>
  </div>

  <script>
    let token = localStorage.getItem('token');

    if (token) {
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('app').style.display = 'block';
    }

    async function login() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        token = data.token;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('app').style.display = 'block';
      } else {
        alert('Login failed');
      }
    }

    async function createEvent() {
      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      const dateTime = document.getElementById('dateTime').value;
      const totalSlots = document.getElementById('totalSlots').value;

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, dateTime, totalSlots })
      });

      if (response.ok) {
        const event = await response.json();
        alert('Event created: ' + event.title);
      } else {
        alert('Failed to create event');
      }
    }

    function logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
  </script>
</body>
</html>
```

## Troubleshooting

### "Access denied. No token provided."
- Make sure you're including the Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN`

### "Invalid or expired token"
- Token may have expired (24h validity)
- Login again to get a new token

### "You do not have permission to update this event"
- You can only update/delete events you created
- Check that you're using the correct user token

### "Access denied. Superuser role required."
- This endpoint requires superuser privileges
- Contact an administrator

## Future Enhancements

- [ ] Implement refresh tokens
- [ ] Add password reset functionality
- [ ] Implement email verification
- [ ] Add OAuth2 integration (Google, GitHub, etc.)
- [ ] Implement rate limiting per user
- [ ] Add audit logging for sensitive operations
- [ ] Support for user groups and custom permissions
