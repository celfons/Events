// API Base URL
const API_URL = window.location.origin;

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
    checkAuthStatus();
    loadEvents();
    
    // Search functionality
    searchInput.addEventListener('input', () => {
        filterAndDisplayEvents();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterAndDisplayEvents();
    });

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
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
        const events = await response.json();

        loadingElement.classList.add('d-none');

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

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_URL}/api/auth/me`);
        const loginNavItem = document.getElementById('loginNavItem');
        const userNavItem = document.getElementById('userNavItem');
        const logoutNavItem = document.getElementById('logoutNavItem');
        const usernameDisplay = document.getElementById('usernameDisplay');

        if (response.ok) {
            const data = await response.json();
            // User is logged in
            loginNavItem.classList.add('d-none');
            userNavItem.classList.remove('d-none');
            logoutNavItem.classList.remove('d-none');
            usernameDisplay.textContent = data.username;
        } else {
            // User is not logged in
            loginNavItem.classList.remove('d-none');
            userNavItem.classList.add('d-none');
            logoutNavItem.classList.add('d-none');
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

// Handle logout
async function handleLogout(e) {
    e.preventDefault();
    
    try {
        const response = await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST'
        });

        if (response.ok) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

