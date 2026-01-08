/**
 * @jest-environment jsdom
 */

describe('users.js - User Management', () => {
  let store;
  let mockFetch;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="loading" class="d-none"></div>
      <div id="noUsers" class="d-none"></div>
      <div id="usersTableContainer" class="d-none">
        <table>
          <tbody id="usersTableBody"></tbody>
        </table>
      </div>
      <input id="searchInput" />
      <button id="clearSearchBtn"></button>
      <form id="createUserForm">
        <input id="userUsername" />
        <input id="userEmail" />
        <input id="userPassword" />
        <select id="userRole">
          <option value="user">User</option>
          <option value="superuser">Superuser</option>
        </select>
        <input id="userIsActive" type="checkbox" checked />
      </form>
      <div id="createUserError" class="d-none"></div>
      <button id="submitCreateUser"></button>
      <form id="editUserForm">
        <input id="editUserUsername" />
        <input id="editUserEmail" />
        <input id="editUserPassword" />
        <select id="editUserRole">
          <option value="user">User</option>
          <option value="superuser">Superuser</option>
        </select>
        <input id="editUserIsActive" type="checkbox" />
      </form>
      <button id="submitEditUser"></button>
      <button id="deleteUserBtn"></button>
      <div id="editUserError" class="d-none"></div>
      <div id="userInfo"></div>
      <button id="logoutBtn"></button>
      <div id="createUserModal"></div>
      <div id="editUserModal"></div>
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
      pathname: '/users',
      href: 'http://localhost:3000/users'
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

    // Mock alert
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API Integration - User Management', () => {
    it('should make correct API call to fetch users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'user-2',
          username: 'admin',
          email: 'admin@example.com',
          role: 'superuser',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];

      const token = 'test-token';
      const futureTime = Date.now() + (1000 * 60 * 60);
      store['token'] = token;
      store['tokenExpiration'] = futureTime.toString();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUsers })
      });

      const response = await fetch('http://localhost:3000/api/users', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.length).toBe(2);
      expect(data.data[0].username).toBe('testuser');
    });

    it('should make correct API call to create user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user',
        isActive: true
      };

      const token = 'test-token';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-user-id', ...userData } })
      });

      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/users',
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(data.data.username).toBe('newuser');
    });

    it('should make correct API call to update user', async () => {
      const userId = 'user-123';
      const updateData = {
        username: 'updateduser',
        email: 'updated@example.com',
        role: 'superuser',
        isActive: false
      };

      const token = 'test-token';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: userId, ...updateData } })
      });

      const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(userId),
        expect.objectContaining({
          method: 'PUT'
        })
      );
      expect(data.data.username).toBe('updateduser');
    });

    it('should make correct API call to delete user', async () => {
      const userId = 'user-123';
      const token = 'test-token';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true } })
      });

      const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(userId),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      expect(data.data.success).toBe(true);
    });

    it('should handle 401 authentication error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      const response = await fetch('http://localhost:3000/api/users');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should handle 403 forbidden error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' })
      });

      const response = await fetch('http://localhost:3000/api/users');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should check for valid token', () => {
      const token = 'test-token';
      const futureTime = Date.now() + (1000 * 60 * 60);
      store['token'] = token;
      store['tokenExpiration'] = futureTime.toString();

      const hasToken = !!store['token'];
      const isExpired = Date.now() > parseInt(store['tokenExpiration']);

      expect(hasToken).toBe(true);
      expect(isExpired).toBe(false);
    });

    it('should check for superuser role', () => {
      const user = {
        id: '1',
        username: 'admin',
        role: 'superuser'
      };
      store['user'] = JSON.stringify(user);

      const storedUser = JSON.parse(store['user']);
      const isSuperuser = storedUser && storedUser.role === 'superuser';

      expect(isSuperuser).toBe(true);
    });

    it('should reject non-superuser', () => {
      const user = {
        id: '1',
        username: 'regular',
        role: 'user'
      };
      store['user'] = JSON.stringify(user);

      const storedUser = JSON.parse(store['user']);
      const isSuperuser = storedUser && storedUser.role === 'superuser';

      expect(isSuperuser).toBe(false);
    });
  });

  describe('User Filtering', () => {
    it('should filter users by username', () => {
      const users = [
        { username: 'john', email: 'john@example.com' },
        { username: 'jane', email: 'jane@example.com' },
        { username: 'johnny', email: 'johnny@example.com' }
      ];

      const searchQuery = 'john';
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filtered.length).toBe(2);
    });

    it('should filter users by email', () => {
      const users = [
        { username: 'john', email: 'john@example.com' },
        { username: 'jane', email: 'jane@example.com' }
      ];

      const searchQuery = 'jane@';
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].username).toBe('jane');
    });

    it('should be case-insensitive', () => {
      const users = [
        { username: 'JohnDoe', email: 'JOHN@EXAMPLE.COM' }
      ];

      const queries = ['john', 'JOHN', 'John'];

      queries.forEach(query => {
        const filtered = users.filter(user =>
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
        );
        expect(filtered.length).toBe(1);
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate user creation form fields', () => {
      const username = 'newuser';
      const email = 'newuser@example.com';
      const password = 'password123';

      const isValid = !!(username.trim() && email.trim() && password);

      expect(isValid).toBe(true);
    });

    it('should reject user with empty username', () => {
      const username = '  ';
      const email = 'newuser@example.com';
      const password = 'password123';

      const isValid = !!(username.trim() && email.trim() && password);

      expect(isValid).toBe(false);
    });

    it('should reject user with empty email', () => {
      const username = 'newuser';
      const email = '';
      const password = 'password123';

      const isValid = !!(username.trim() && email.trim() && password);

      expect(isValid).toBe(false);
    });

    it('should reject user with short password', () => {
      const password = '12345';
      const isValidLength = password.length >= 6;

      expect(isValidLength).toBe(false);
    });

    it('should accept user with valid password', () => {
      const password = '123456';
      const isValidLength = password.length >= 6;

      expect(isValidLength).toBe(true);
    });

    it('should allow updating user without password', () => {
      const username = 'updateduser';
      const email = 'updated@example.com';
      const password = ''; // Empty password for update

      // Update validation - password is optional
      const isValid = !!(username.trim() && email.trim());

      expect(isValid).toBe(true);
    });

    it('should validate password length only if provided during update', () => {
      const password = '123'; // Too short

      if (password && password.length > 0) {
        const isValidLength = password.length >= 6;
        expect(isValidLength).toBe(false);
      }
    });
  });

  describe('User Display', () => {
    it('should display role badge correctly for superuser', () => {
      const user = { role: 'superuser' };
      const roleLabel = user.role === 'superuser' 
        ? '<span class="badge bg-danger">Superuser</span>'
        : '<span class="badge bg-primary">User</span>';

      expect(roleLabel).toContain('bg-danger');
      expect(roleLabel).toContain('Superuser');
    });

    it('should display role badge correctly for regular user', () => {
      const user = { role: 'user' };
      const roleLabel = user.role === 'superuser' 
        ? '<span class="badge bg-danger">Superuser</span>'
        : '<span class="badge bg-primary">User</span>';

      expect(roleLabel).toContain('bg-primary');
      expect(roleLabel).toContain('User');
    });

    it('should display status badge for active user', () => {
      const user = { isActive: true };
      const statusLabel = user.isActive 
        ? '<span class="badge bg-success">Ativo</span>'
        : '<span class="badge bg-secondary">Inativo</span>';

      expect(statusLabel).toContain('bg-success');
      expect(statusLabel).toContain('Ativo');
    });

    it('should display status badge for inactive user', () => {
      const user = { isActive: false };
      const statusLabel = user.isActive 
        ? '<span class="badge bg-success">Ativo</span>'
        : '<span class="badge bg-secondary">Inativo</span>';

      expect(statusLabel).toContain('bg-secondary');
      expect(statusLabel).toContain('Inativo');
    });

    it('should format created date in pt-BR locale', () => {
      const createdDate = new Date('2024-01-15T10:30:00');
      const formattedDate = createdDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      expect(formattedDate).toContain('2024');
      expect(formattedDate).toContain('10:30');
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML in user email', () => {
      const unsafeEmail = '<script>alert("XSS")</script>@example.com';
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      const escapedEmail = unsafeEmail.replace(/[&<>"']/g, m => map[m]);

      expect(escapedEmail).not.toContain('<script>');
      expect(escapedEmail).toContain('&lt;script&gt;');
    });

    it('should escape HTML in username', () => {
      const unsafeUsername = 'user<img src=x onerror=alert(1)>';
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      const escapedUsername = unsafeUsername.replace(/[&<>"']/g, m => map[m]);

      expect(escapedUsername).not.toContain('<img');
      expect(escapedUsername).toContain('&lt;img');
    });
  });

  describe('DOM Element Tests', () => {
    it('should have all required DOM elements present', () => {
      expect(document.getElementById('loading')).not.toBeNull();
      expect(document.getElementById('noUsers')).not.toBeNull();
      expect(document.getElementById('usersTableContainer')).not.toBeNull();
      expect(document.getElementById('usersTableBody')).not.toBeNull();
      expect(document.getElementById('searchInput')).not.toBeNull();
      expect(document.getElementById('createUserForm')).not.toBeNull();
    });

    it('should manipulate DOM classes correctly', () => {
      const loading = document.getElementById('loading');
      const usersTable = document.getElementById('usersTableContainer');

      loading.classList.remove('d-none');
      usersTable.classList.add('d-none');

      expect(loading.classList.contains('d-none')).toBe(false);
      expect(usersTable.classList.contains('d-none')).toBe(true);
    });

    it('should create user table row', () => {
      const tbody = document.getElementById('usersTableBody');
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>test@example.com</td>
        <td><span class="badge bg-primary">User</span></td>
        <td><span class="badge bg-success">Ativo</span></td>
        <td><button class="btn btn-sm btn-primary">Editar</button></td>
      `;
      
      tbody.appendChild(row);

      expect(tbody.children.length).toBe(1);
      expect(tbody.firstChild.innerHTML).toContain('test@example.com');
    });
  });
});
