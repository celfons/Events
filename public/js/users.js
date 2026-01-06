// API Base URL
const API_URL = window.location.origin;

// DOM Elements
const loadingElement = document.getElementById('loading');
const noUsersElement = document.getElementById('noUsers');
const usersTableContainer = document.getElementById('usersTableContainer');
const usersTableBody = document.getElementById('usersTableBody');
const paginationElement = document.getElementById('pagination');
const editUserError = document.getElementById('editUserError');

// Pagination state
let currentPage = 1;
const usersPerPage = 10;
let currentUserId = null;

// Modals
let editUserModal;

// Load users on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
    loadUsers();

    // Edit user form submission
    document.getElementById('submitEditUser').addEventListener('click', handleUpdateUser);
    
    // Delete user
    document.getElementById('deleteUserBtn').addEventListener('click', handleDeleteUser);
});

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_URL}/api/auth/me`);
        const usernameDisplay = document.getElementById('usernameDisplay');

        if (response.ok) {
            const data = await response.json();
            usernameDisplay.textContent = data.username;
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        window.location.href = '/login';
    }
}

// Handle logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST'
            });

            if (response.ok) {
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    });
}

// Load all users
async function loadUsers() {
    try {
        loadingElement.classList.remove('d-none');
        usersTableContainer.classList.add('d-none');
        noUsersElement.classList.add('d-none');

        const response = await fetch(`${API_URL}/api/users?page=${currentPage}&limit=${usersPerPage}`);
        
        if (!response.ok) {
            throw new Error('Failed to load users');
        }

        const data = await response.json();

        loadingElement.classList.add('d-none');

        if (!data.users || data.users.length === 0) {
            noUsersElement.classList.remove('d-none');
            return;
        }

        displayUsers(data.users);
        displayPagination(data.page, data.totalPages);
        usersTableContainer.classList.remove('d-none');
    } catch (error) {
        console.error('Error loading users:', error);
        loadingElement.classList.add('d-none');
        noUsersElement.textContent = 'Erro ao carregar usuários. Tente novamente mais tarde.';
        noUsersElement.classList.remove('d-none');
    }
}

// Display users in table
function displayUsers(users) {
    usersTableBody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        
        const groupNames = user.groups && user.groups.length > 0 
            ? user.groups.map(g => g.name || g).join(', ')
            : 'Nenhum';
        
        const statusBadge = user.isActive 
            ? '<span class="badge bg-success">Ativo</span>'
            : '<span class="badge bg-danger">Inativo</span>';

        const createdDate = new Date(user.createdAt).toLocaleDateString('pt-BR');

        row.innerHTML = `
            <td>${escapeHtml(user.username)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(groupNames)}</td>
            <td>${statusBadge}</td>
            <td>${createdDate}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openEditUserModal('${user.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        `;

        usersTableBody.appendChild(row);
    });
}

// Display pagination
function displayPagination(page, totalPages) {
    paginationElement.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${page === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${page - 1}); return false;">Anterior</a>`;
    paginationElement.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === page ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>`;
        paginationElement.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${page === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${page + 1}); return false;">Próxima</a>`;
    paginationElement.appendChild(nextLi);
}

// Change page
function changePage(page) {
    currentPage = page;
    loadUsers();
}

// Open edit user modal
async function openEditUserModal(userId) {
    currentUserId = userId;
    editUserError.classList.add('d-none');

    try {
        // Get user details (we'll use the list, but in production you'd fetch individual user)
        const response = await fetch(`${API_URL}/api/users`);
        const data = await response.json();
        const user = data.users.find(u => u.id === userId);

        if (!user) {
            alert('Usuário não encontrado');
            return;
        }

        document.getElementById('editUsername').value = user.username;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editPassword').value = '';
        document.getElementById('editIsActive').checked = user.isActive;

        editUserModal.show();
    } catch (error) {
        alert('Erro ao carregar usuário: ' + error.message);
    }
}

// Handle update user
async function handleUpdateUser() {
    const username = document.getElementById('editUsername').value;
    const email = document.getElementById('editEmail').value;
    const password = document.getElementById('editPassword').value;
    const isActive = document.getElementById('editIsActive').checked;

    editUserError.classList.add('d-none');

    const userData = {
        username,
        email,
        isActive
    };

    if (password) {
        userData.password = password;
    }

    try {
        const response = await fetch(`${API_URL}/api/users/${currentUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao atualizar usuário');
        }

        editUserModal.hide();
        loadUsers();
        alert('Usuário atualizado com sucesso!');
    } catch (error) {
        editUserError.textContent = error.message;
        editUserError.classList.remove('d-none');
    }
}

// Handle delete user
async function handleDeleteUser() {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/users/${currentUserId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao excluir usuário');
        }

        editUserModal.hide();
        loadUsers();
        alert('Usuário excluído com sucesso!');
    } catch (error) {
        alert('Erro ao excluir usuário: ' + error.message);
    }
}

// Helper function
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
