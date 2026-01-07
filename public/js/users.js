// API Base URL
const API_URL = window.location.origin;

// Check authentication and superuser on page load
function checkAuthentication() {
    const token = getToken();
    if (!token) {
        window.location.href = '/?login=required';
        return false;
    }
    
    // Check if user is superuser
    const user = getUser();
    if (!user || user.role !== 'superuser') {
        alert('Acesso negado. Apenas superusuários podem acessar esta página.');
        window.location.href = '/';
        return false;
    }
    
    return true;
}

// Handle authentication failure
function handleAuthFailure() {
    clearAuthData();
    window.location.href = '/?login=required';
}

// Get auth token for API requests
function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// DOM Elements
const loadingElement = document.getElementById('loading');
const noUsersElement = document.getElementById('noUsers');
const usersTableContainer = document.getElementById('usersTableContainer');
const usersTableBody = document.getElementById('usersTableBody');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const createUserForm = document.getElementById('createUserForm');
const submitCreateUserBtn = document.getElementById('submitCreateUser');
const createUserError = document.getElementById('createUserError');
const editUserForm = document.getElementById('editUserForm');
const submitEditUserBtn = document.getElementById('submitEditUser');
const deleteUserBtn = document.getElementById('deleteUserBtn');
const editUserError = document.getElementById('editUserError');

// State
let allUsers = [];
let filteredUsers = [];
let currentUserId = null;

// Load users on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated and is superuser
    if (!checkAuthentication()) {
        return;
    }
    
    // Display user info
    const user = getUser();
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement && user.username) {
        userInfoElement.textContent = `Olá, ${user.username}`;
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearAuthData();
            window.location.href = '/';
        });
    }
    
    loadUsers();
    
    // Search functionality
    searchInput.addEventListener('input', () => {
        filterAndDisplayUsers();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterAndDisplayUsers();
    });
});

// Load all users
async function loadUsers() {
    try {
        loadingElement.classList.remove('d-none');
        usersTableContainer.classList.add('d-none');
        noUsersElement.classList.add('d-none');

        const response = await fetch(`${API_URL}/api/users`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleAuthFailure();
                return;
            }
            let errorMessage = 'Erro ao carregar usuários';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }
        
        const users = await response.json();
        loadingElement.classList.add('d-none');

        if (!Array.isArray(users) || users.length === 0) {
            noUsersElement.classList.remove('d-none');
            return;
        }

        allUsers = users;
        usersTableContainer.classList.remove('d-none');
        filterAndDisplayUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        loadingElement.classList.add('d-none');
        noUsersElement.textContent = 'Erro ao carregar usuários. Tente novamente mais tarde.';
        noUsersElement.classList.remove('d-none');
    }
}

// Filter users based on search query
function filterAndDisplayUsers() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    
    if (searchQuery === '') {
        filteredUsers = allUsers;
    } else {
        filteredUsers = allUsers.filter(user => 
            user.username.toLowerCase().includes(searchQuery) ||
            user.email.toLowerCase().includes(searchQuery)
        );
    }
    
    if (filteredUsers.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum usuário encontrado.</td></tr>';
        return;
    }
    
    displayUsers();
}

// Display users
function displayUsers() {
    usersTableBody.innerHTML = '';

    filteredUsers.forEach(user => {
        const row = createUserRow(user);
        usersTableBody.appendChild(row);
    });
}

// Create user table row
function createUserRow(user) {
    const row = document.createElement('tr');
    
    const createdDate = new Date(user.createdAt);
    const formattedDate = createdDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const roleLabel = user.role === 'superuser' ? 
        '<span class="badge bg-danger">Superuser</span>' : 
        '<span class="badge bg-primary">User</span>';

    const statusLabel = user.isActive ? 
        '<span class="badge bg-success">Ativo</span>' : 
        '<span class="badge bg-secondary">Inativo</span>';

    row.innerHTML = `
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${roleLabel}</td>
        <td>${statusLabel}</td>
        <td>${formattedDate}</td>
        <td>
            <button class="btn btn-sm btn-primary edit-user-btn" data-user-id="${user.id}">
                <i class="bi bi-pencil"></i> Editar
            </button>
        </td>
    `;

    row.querySelector('.edit-user-btn').addEventListener('click', () => {
        openEditUserModal(user.id);
    });

    return row;
}

// Create user form submission
submitCreateUserBtn.addEventListener('click', async () => {
    const username = document.getElementById('userUsername').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const isActive = document.getElementById('userIsActive').checked;

    if (!username || !email || !password) {
        showError(createUserError, 'Todos os campos são obrigatórios');
        return;
    }

    if (password.length < 6) {
        showError(createUserError, 'A senha deve ter pelo menos 6 caracteres');
        return;
    }

    try {
        submitCreateUserBtn.disabled = true;
        submitCreateUserBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Criando...';

        const response = await fetch(`${API_URL}/api/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                username,
                email,
                password,
                role,
                isActive
            })
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao criar usuário';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        // Success
        createUserForm.reset();
        createUserError.classList.add('d-none');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createUserModal'));
        modal.hide();

        // Reload users
        await loadUsers();

        alert('Usuário criado com sucesso!');
    } catch (error) {
        showError(createUserError, error.message);
    } finally {
        submitCreateUserBtn.disabled = false;
        submitCreateUserBtn.innerHTML = 'Criar Usuário';
    }
});

// Open edit user modal
async function openEditUserModal(userId) {
    try {
        const user = allUsers.find(u => u.id === userId);
        if (!user) {
            alert('Usuário não encontrado');
            return;
        }
        
        currentUserId = userId;

        // Populate form fields
        document.getElementById('editUserUsername').value = user.username;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserPassword').value = ''; // Clear password field
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editUserIsActive').checked = user.isActive;

        editUserError.classList.add('d-none');

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
    } catch (error) {
        alert('Erro ao carregar dados do usuário: ' + error.message);
    }
}

// Edit user form submission
submitEditUserBtn.addEventListener('click', async () => {
    const username = document.getElementById('editUserUsername').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const password = document.getElementById('editUserPassword').value;
    const role = document.getElementById('editUserRole').value;
    const isActive = document.getElementById('editUserIsActive').checked;

    if (!username || !email) {
        showError(editUserError, 'Todos os campos são obrigatórios');
        return;
    }

    // Validate password if provided
    if (password && password.length > 0 && password.length < 6) {
        showError(editUserError, 'A senha deve ter pelo menos 6 caracteres');
        return;
    }

    try {
        submitEditUserBtn.disabled = true;
        submitEditUserBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Atualizando...';

        const updateData = {
            username,
            email,
            role,
            isActive
        };

        // Only include password if it was provided
        if (password && password.length > 0) {
            updateData.password = password;
        }

        const response = await fetch(`${API_URL}/api/users/${currentUserId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao atualizar usuário';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        // Success
        editUserError.classList.add('d-none');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        modal.hide();

        // Reload users
        await loadUsers();

        alert('Usuário atualizado com sucesso!');
    } catch (error) {
        showError(editUserError, error.message);
    } finally {
        submitEditUserBtn.disabled = false;
        submitEditUserBtn.innerHTML = 'Atualizar';
    }
});

// Delete user
deleteUserBtn.addEventListener('click', async () => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        deleteUserBtn.disabled = true;
        deleteUserBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Excluindo...';

        const response = await fetch(`${API_URL}/api/users/${currentUserId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao excluir usuário';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        modal.hide();

        // Reload users
        await loadUsers();

        alert('Usuário excluído com sucesso!');
    } catch (error) {
        alert('Erro ao excluir usuário: ' + error.message);
    } finally {
        deleteUserBtn.disabled = false;
        deleteUserBtn.innerHTML = '<i class="bi bi-trash"></i> Excluir';
    }
});

// Helper functions
function showError(element, message) {
    element.textContent = message;
    element.classList.remove('d-none');
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
