// API Base URL
const API_URL = window.location.origin;

// DOM Elements
const loadingElement = document.getElementById('loading');
const noGroupsElement = document.getElementById('noGroups');
const groupsTableContainer = document.getElementById('groupsTableContainer');
const groupsTableBody = document.getElementById('groupsTableBody');
const paginationElement = document.getElementById('pagination');
const createGroupError = document.getElementById('createGroupError');
const editGroupError = document.getElementById('editGroupError');

// Pagination state
let currentPage = 1;
const groupsPerPage = 10;
let currentGroupId = null;

// Modals
let createGroupModal;
let editGroupModal;

// Load groups on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    createGroupModal = new bootstrap.Modal(document.getElementById('createGroupModal'));
    editGroupModal = new bootstrap.Modal(document.getElementById('editGroupModal'));
    loadGroups();

    // Create group form submission
    document.getElementById('submitCreateGroup').addEventListener('click', handleCreateGroup);
    
    // Edit group form submission
    document.getElementById('submitEditGroup').addEventListener('click', handleUpdateGroup);
    
    // Delete group
    document.getElementById('deleteGroupBtn').addEventListener('click', handleDeleteGroup);
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

// Load all groups
async function loadGroups() {
    try {
        loadingElement.classList.remove('d-none');
        groupsTableContainer.classList.add('d-none');
        noGroupsElement.classList.add('d-none');

        const response = await fetch(`${API_URL}/api/groups?page=${currentPage}&limit=${groupsPerPage}`);
        
        if (!response.ok) {
            throw new Error('Failed to load groups');
        }

        const data = await response.json();

        loadingElement.classList.add('d-none');

        if (!data.groups || data.groups.length === 0) {
            noGroupsElement.classList.remove('d-none');
            return;
        }

        displayGroups(data.groups);
        displayPagination(data.page, data.totalPages);
        groupsTableContainer.classList.remove('d-none');
    } catch (error) {
        console.error('Error loading groups:', error);
        loadingElement.classList.add('d-none');
        noGroupsElement.textContent = 'Erro ao carregar grupos. Tente novamente mais tarde.';
        noGroupsElement.classList.remove('d-none');
    }
}

// Display groups in table
function displayGroups(groups) {
    groupsTableBody.innerHTML = '';

    groups.forEach(group => {
        const row = document.createElement('tr');
        
        const permissions = group.permissions && group.permissions.length > 0 
            ? group.permissions.join(', ')
            : 'Nenhuma';

        const createdDate = new Date(group.createdAt).toLocaleDateString('pt-BR');

        row.innerHTML = `
            <td>${escapeHtml(group.name)}</td>
            <td>${escapeHtml(group.description || '-')}</td>
            <td><small>${escapeHtml(permissions)}</small></td>
            <td>${createdDate}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openEditGroupModal('${group.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        `;

        groupsTableBody.appendChild(row);
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
    loadGroups();
}

// Handle create group
async function handleCreateGroup() {
    const name = document.getElementById('groupName').value;
    const description = document.getElementById('groupDescription').value;
    const permissionsStr = document.getElementById('groupPermissions').value;
    const permissions = permissionsStr ? permissionsStr.split(',').map(p => p.trim()) : [];

    createGroupError.classList.add('d-none');

    try {
        const response = await fetch(`${API_URL}/api/groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description, permissions })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao criar grupo');
        }

        createGroupModal.hide();
        document.getElementById('createGroupForm').reset();
        loadGroups();
        alert('Grupo criado com sucesso!');
    } catch (error) {
        createGroupError.textContent = error.message;
        createGroupError.classList.remove('d-none');
    }
}

// Open edit group modal
async function openEditGroupModal(groupId) {
    currentGroupId = groupId;
    editGroupError.classList.add('d-none');

    try {
        // Get group details
        const response = await fetch(`${API_URL}/api/groups`);
        const data = await response.json();
        const group = data.groups.find(g => g.id === groupId);

        if (!group) {
            alert('Grupo não encontrado');
            return;
        }

        document.getElementById('editGroupName').value = group.name;
        document.getElementById('editGroupDescription').value = group.description || '';
        document.getElementById('editGroupPermissions').value = group.permissions ? group.permissions.join(', ') : '';

        editGroupModal.show();
    } catch (error) {
        alert('Erro ao carregar grupo: ' + error.message);
    }
}

// Handle update group
async function handleUpdateGroup() {
    const name = document.getElementById('editGroupName').value;
    const description = document.getElementById('editGroupDescription').value;
    const permissionsStr = document.getElementById('editGroupPermissions').value;
    const permissions = permissionsStr ? permissionsStr.split(',').map(p => p.trim()) : [];

    editGroupError.classList.add('d-none');

    try {
        const response = await fetch(`${API_URL}/api/groups/${currentGroupId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description, permissions })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao atualizar grupo');
        }

        editGroupModal.hide();
        loadGroups();
        alert('Grupo atualizado com sucesso!');
    } catch (error) {
        editGroupError.textContent = error.message;
        editGroupError.classList.remove('d-none');
    }
}

// Handle delete group
async function handleDeleteGroup() {
    if (!confirm('Tem certeza que deseja excluir este grupo?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/groups/${currentGroupId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao excluir grupo');
        }

        editGroupModal.hide();
        loadGroups();
        alert('Grupo excluído com sucesso!');
    } catch (error) {
        alert('Erro ao excluir grupo: ' + error.message);
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
