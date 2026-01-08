// API Base URL
const API_URL = window.location.origin;

// Check authentication status and update UI
function updateAuthUI() {
    const token = getToken();
    const user = getUser();
    
    const loginItem = document.getElementById('loginItem');
    const logoutItem = document.getElementById('logoutItem');
    const userInfoItem = document.getElementById('userInfoItem');
    const userInfo = document.getElementById('userInfo');
    const adminLink = document.getElementById('adminLink');
    
    if (token && user && user.username) {
        // User is logged in
        loginItem.classList.add('d-none');
        logoutItem.classList.remove('d-none');
        userInfoItem.classList.remove('d-none');
        userInfo.textContent = `Olá, ${user.username}`;
        
        // Show Users link only for superusers
        if (user.role === 'superuser') {
            // Create users link if it doesn't exist
            let usersLink = document.getElementById('usersLink');
            if (!usersLink) {
                const navList = document.querySelector('.navbar-nav');
                const adminItem = adminLink.parentElement;
                const usersItem = document.createElement('li');
                usersItem.className = 'nav-item';
                usersItem.innerHTML = '<a class="nav-link" href="/users" id="usersLink">Usuários</a>';
                navList.insertBefore(usersItem, adminItem.nextSibling);
            }
        }
    } else {
        // User is not logged in or token expired
        loginItem.classList.remove('d-none');
        logoutItem.classList.add('d-none');
        userInfoItem.classList.add('d-none');
        
        // Remove users link if it exists
        const usersLink = document.getElementById('usersLink');
        if (usersLink) {
            usersLink.parentElement.remove();
        }
    }
}

// Login functionality
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao fazer login');
        }
        
        const data = await response.json();
        saveToken(data.token, data.user);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Logout functionality
function logout() {
    clearAuthData();
    updateAuthUI();
}

// DOM Elements
const eventsContainer = document.getElementById('eventsContainer');
const loadingElement = document.getElementById('loading');
const noEventsElement = document.getElementById('noEvents');
const paginationElement = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

// Pagination state
let currentPage = 1;
const eventsPerPage = 5;
let allEvents = [];
let futureEvents = [];
let filteredEvents = [];

// Load events on page load
document.addEventListener('DOMContentLoaded', () => {
    // Update auth UI
    updateAuthUI();
    
    // Check if login is required (redirected from protected page)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'required') {
        // Open login modal automatically
        const loginModalElement = document.getElementById('loginModal');
        if (loginModalElement) {
            const loginModal = new bootstrap.Modal(loginModalElement);
            loginModal.show();
        }
        
        // Remove the query parameter from URL without reloading
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }
    
    // Setup login form
    const submitLoginBtn = document.getElementById('submitLogin');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    if (submitLoginBtn && loginForm) {
        submitLoginBtn.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                loginError.textContent = 'Todos os campos são obrigatórios';
                loginError.classList.remove('d-none');
                return;
            }
            
            submitLoginBtn.disabled = true;
            submitLoginBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Entrando...';
            
            const result = await login(email, password);
            
            if (result.success) {
                loginError.classList.add('d-none');
                loginForm.reset();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                modal.hide();
                
                // Update UI
                updateAuthUI();
                
                alert('Login realizado com sucesso!');
            } else {
                loginError.textContent = result.error;
                loginError.classList.remove('d-none');
            }
            
            submitLoginBtn.disabled = false;
            submitLoginBtn.innerHTML = 'Entrar';
        });
    }
    
    loadEvents();
    
    // Search functionality
    searchInput.addEventListener('input', () => {
        filterAndDisplayEvents();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterAndDisplayEvents();
    });
});

// Reload events when page becomes visible (user returns to tab)
// This ensures available slots are updated after registrations
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        loadEvents();
    }
});

// Load all events
async function loadEvents() {
    try {
        loadingElement.classList.remove('d-none');
        eventsContainer.innerHTML = '';
        noEventsElement.classList.add('d-none');

        const response = await fetch(`${API_URL}/api/events`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar eventos');
        }
        
        const responseData = await response.json();

        loadingElement.classList.add('d-none');

        // Extract events array from the response data object
        const events = responseData.data || [];

        if (!Array.isArray(events)) {
            noEventsElement.classList.remove('d-none');
            return;
        }

        allEvents = events;
        
        // Filter events from today onwards (exclude only past events)
        // Get start of current day to include all events happening today
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        futureEvents = events.filter(event => new Date(event.dateTime) >= startOfToday);

        filterAndDisplayEvents();
    } catch (error) {
        console.error('Error loading events:', error);
        loadingElement.classList.add('d-none');
        eventsContainer.innerHTML = '<div class="alert alert-danger">Erro ao carregar eventos. Tente novamente mais tarde.</div>';
    }
}

// Filter events based on search query
function filterAndDisplayEvents() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    
    if (searchQuery === '') {
        filteredEvents = futureEvents;
    } else {
        filteredEvents = futureEvents.filter(event => 
            event.title.toLowerCase().includes(searchQuery)
        );
    }
    
    if (filteredEvents.length === 0) {
        eventsContainer.innerHTML = '';
        noEventsElement.classList.remove('d-none');
        paginationElement.innerHTML = '';
        return;
    }
    
    noEventsElement.classList.add('d-none');
    currentPage = 1; // Reset to first page when filtering
    displayPage(currentPage);
}

// Display a specific page of events
function displayPage(page) {
    currentPage = page;
    eventsContainer.innerHTML = '';

    const startIndex = (page - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const pageEvents = filteredEvents.slice(startIndex, endIndex);

    pageEvents.forEach(event => {
        eventsContainer.appendChild(createEventCard(event));
    });

    renderPagination();
}

// Render pagination controls
function renderPagination() {
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
    paginationElement.innerHTML = '';

    if (totalPages <= 1) {
        return;
    }

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    if (currentPage > 1) {
        prevLi.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            displayPage(currentPage - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    paginationElement.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageLi.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            displayPage(i);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationElement.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    if (currentPage < totalPages) {
        nextLi.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            displayPage(currentPage + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    paginationElement.appendChild(nextLi);
}

// Create event card HTML
function createEventCard(event) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 fade-in';
    
    const eventDate = new Date(event.dateTime);
    const formattedDate = eventDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const slotsColor = event.availableSlots > 10 ? 'success' : event.availableSlots > 0 ? 'warning' : 'danger';
    const slotsText = event.availableSlots > 0 
        ? `${event.availableSlots} vagas disponíveis` 
        : 'Esgotado';
    
    const localBadge = event.local 
        ? `<span class="badge bg-secondary"><i class="bi bi-geo-alt"></i> ${escapeHtml(event.local)}</span>`
        : '';

    col.innerHTML = `
        <div class="card event-card h-100">
            <div class="card-body">
                <h5 class="card-title">${escapeHtml(event.title)}</h5>
                <p class="card-text text-muted">${escapeHtml(event.description)}</p>
                <div class="mb-3">
                    <span class="badge bg-primary">
                        <i class="bi bi-calendar"></i> ${formattedDate}
                    </span>
                    <span class="badge bg-${slotsColor}">
                        <i class="bi bi-people"></i> ${slotsText}
                    </span>
                    ${localBadge}
                </div>
                <a href="/event/${event.id}" class="btn btn-primary w-100">
                    Ver Detalhes
                </a>
            </div>
        </div>
    `;
    
    return col;
}

// Helper functions
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
