// API Base URL
const API_URL = window.location.origin;

// Check authentication on page load
function checkAuthentication() {
    const token = getToken();
    if (!token) {
        // Redirect to home page with login prompt
        window.location.href = '/?login=required';
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
const noEventsElement = document.getElementById('noEvents');
const eventsTableContainer = document.getElementById('eventsTableContainer');
const eventsTableBody = document.getElementById('eventsTableBody');
const paginationElement = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const createEventForm = document.getElementById('createEventForm');
const submitCreateEventBtn = document.getElementById('submitCreateEvent');
const createEventError = document.getElementById('createEventError');
const updateEventForm = document.getElementById('updateEventForm');
const submitUpdateEventBtn = document.getElementById('submitUpdateEvent');
const deleteEventBtn = document.getElementById('deleteEventBtn');
const viewParticipantsBtn = document.getElementById('viewParticipantsBtn');
const updateEventError = document.getElementById('updateEventError');

// Pagination state
let currentPage = 1;
const eventsPerPage = 10;
let allEvents = [];
let filteredEvents = [];
let currentEventId = null;
let currentStatusFilter = 'all'; // 'all' or 'active'

// Participants pagination
let currentParticipantsPage = 1;
const participantsPerPage = 5;
let allParticipants = [];
let filteredParticipants = [];

// Load events on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    if (!checkAuthentication()) {
        return;
    }
    
    // Display user info
    const user = getUser();
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement && user && user.username) {
        userInfoElement.textContent = `Olá, ${user.username}`;
    }
    
    // Show Users link for superusers
    if (user && user.role === 'superuser') {
        const usersNavItem = document.getElementById('usersNavItem');
        if (usersNavItem) {
            usersNavItem.style.display = 'block';
        }
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearAuthData();
            window.location.href = '/';
        });
    }
    
    loadEvents();
    
    // Event search functionality
    searchInput.addEventListener('input', () => {
        filterAndDisplayEvents();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterAndDisplayEvents();
    });
    
    // Status filter switch functionality
    const activeOnlySwitch = document.getElementById('activeOnlySwitch');
    
    if (activeOnlySwitch) {
        activeOnlySwitch.addEventListener('change', () => {
            // When switch is ON, show only active events; when OFF, show all events
            currentStatusFilter = activeOnlySwitch.checked ? 'active' : 'all';
            filterAndDisplayEvents();
        });
    }
});

// Load all events
async function loadEvents() {
    try {
        loadingElement.classList.remove('d-none');
        eventsTableContainer.classList.add('d-none');
        noEventsElement.classList.add('d-none');

        const response = await fetch(`${API_URL}/api/events/my-events`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            let errorMessage = 'Erro ao carregar eventos';
            if (response.status === 401 || response.status === 403) {
                // Authentication failed, redirect to home
                handleAuthFailure();
                return;
            }
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }
        
        const events = await response.json();
        loadingElement.classList.add('d-none');

        if (!Array.isArray(events) || events.length === 0) {
            noEventsElement.classList.remove('d-none');
            return;
        }

        allEvents = events;
        eventsTableContainer.classList.remove('d-none');
        filterAndDisplayEvents();
    } catch (error) {
        console.error('Error loading events:', error);
        loadingElement.classList.add('d-none');
        showError(noEventsElement, 'Erro ao carregar eventos. Tente novamente mais tarde.');
        noEventsElement.classList.remove('d-none');
    }
}

// Filter events based on search query and status
function filterAndDisplayEvents() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    
    // Start with all events
    let eventsToFilter = allEvents;
    
    // Apply status filter
    // Note: Events with undefined isActive are treated as active (backend default)
    if (currentStatusFilter === 'active') {
        eventsToFilter = eventsToFilter.filter(event => event.isActive !== false);
    }
    // If 'all', don't filter by status
    
    // Apply search filter
    if (searchQuery === '') {
        filteredEvents = eventsToFilter;
    } else {
        filteredEvents = eventsToFilter.filter(event => 
            event.title.toLowerCase().includes(searchQuery)
        );
    }
    
    if (filteredEvents.length === 0) {
        eventsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum evento encontrado.</td></tr>';
        paginationElement.innerHTML = '';
        return;
    }
    
    currentPage = 1; // Reset to first page when filtering
    displayPage(currentPage);
}

// Display a specific page of events
function displayPage(page) {
    currentPage = page;
    eventsTableBody.innerHTML = '';

    const startIndex = (page - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const pageEvents = filteredEvents.slice(startIndex, endIndex);

    pageEvents.forEach(event => {
        const row = createEventRow(event);
        eventsTableBody.appendChild(row);
    });

    renderPagination();
}

// Create event table row
function createEventRow(event) {
    const row = document.createElement('tr');
    
    const eventDate = new Date(event.dateTime);
    const formattedDate = eventDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Determine status badge (treat undefined as active to match backend default)
    const isActive = event.isActive !== false;
    const statusBadge = isActive 
        ? '<span class="badge bg-success">Ativo</span>' 
        : '<span class="badge bg-secondary">Inativo</span>';

    row.innerHTML = `
        <td>${escapeHtml(event.title)}</td>
        <td>${formattedDate}</td>
        <td>${event.availableSlots}</td>
        <td>${statusBadge}</td>
        <td>
            <button class="btn btn-sm btn-primary view-details-btn" data-event-id="${event.id}">
                <i class="bi bi-eye"></i> Detalhes
            </button>
        </td>
    `;

    row.querySelector('.view-details-btn').addEventListener('click', () => {
        openEventDetailsModal(event.id);
    });

    return row;
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
        });
    }
    paginationElement.appendChild(nextLi);
}

// Helper function to convert datetime-local input to ISO string with proper timezone handling
function convertLocalDateTimeToISO(dateTimeLocalValue) {
    // dateTimeLocalValue is in format: "2024-12-31T14:00" (no timezone info)
    // This represents the user's LOCAL time (e.g., 14:00 Brazilian time for users in Brazil)
    // 
    // When we create a Date object from this string, JavaScript interprets it as local time
    // For a Brazilian user (UTC-3):
    //   - Input: "2024-12-31T14:00" represents 14:00 BRT
    //   - new Date() creates: Date object for 14:00 BRT
    //   - toISOString() converts to UTC: "2024-12-31T17:00:00.000Z" (adds 3 hours)
    // 
    // This ensures MongoDB stores the correct UTC time, which will display
    // as the correct local time when rendered in the user's timezone
    const localDate = new Date(dateTimeLocalValue);
    return localDate.toISOString();
}

// Helper function to format Date object for datetime-local input
function formatDateForInput(date) {
    // Convert UTC date from database to local time components for datetime-local input
    // This ensures the user sees the time in their local timezone when editing
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Create event form submission
submitCreateEventBtn.addEventListener('click', async () => {
    const title = document.getElementById('eventTitle').value.trim();
    const description = document.getElementById('eventDescription').value.trim();
    const dateTime = document.getElementById('eventDateTime').value;
    const totalSlots = parseInt(document.getElementById('eventSlots').value);
    const local = document.getElementById('eventLocal').value.trim();

    if (!title || !description || !dateTime || !totalSlots) {
        showError(createEventError, 'Todos os campos são obrigatórios');
        return;
    }

    if (totalSlots < 1) {
        showError(createEventError, 'O número de vagas deve ser pelo menos 1');
        return;
    }

    try {
        submitCreateEventBtn.disabled = true;
        submitCreateEventBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Criando...';

        const requestBody = {
            title,
            description,
            dateTime: convertLocalDateTimeToISO(dateTime),
            totalSlots,
            local
        };

        const response = await fetch(`${API_URL}/api/events`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao criar evento';
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
        createEventForm.reset();
        createEventError.classList.add('d-none');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createEventModal'));
        modal.hide();

        // Reload events
        await loadEvents();

        alert('Evento criado com sucesso!');
    } catch (error) {
        showError(createEventError, error.message);
    } finally {
        submitCreateEventBtn.disabled = false;
        submitCreateEventBtn.innerHTML = 'Criar Evento';
    }
});

// Open event details modal
async function openEventDetailsModal(eventId) {
    try {
        const response = await fetch(`${API_URL}/api/events/${eventId}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            let errorMessage = 'Erro ao carregar detalhes do evento';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        // API returns {event: {...}, registrationsCount: ...}, but fallback to unwrapped response for backward compatibility
        const event = data.event || data;
        
        // Validate event data
        if (!event || typeof event !== 'object') {
            console.error('Invalid event data structure:', data);
            throw new Error('Dados do evento inválidos ou incompletos');
        }
        
        if (!event.title || !event.description || !event.dateTime || event.totalSlots === undefined || event.availableSlots === undefined) {
            console.error('Missing required event fields:', event);
            throw new Error('Dados do evento incompletos');
        }
        
        currentEventId = eventId;

        // Populate form fields
        document.getElementById('updateEventTitle').value = event.title;
        document.getElementById('updateEventDescription').value = event.description;
        
        // Format date for datetime-local input
        // Convert UTC date from database to local time for display in datetime-local input
        const eventDate = new Date(event.dateTime);
        if (isNaN(eventDate.getTime())) {
            console.error('Invalid event dateTime:', event.dateTime);
            throw new Error(`Data do evento inválida: ${event.dateTime}`);
        }
        document.getElementById('updateEventDateTime').value = formatDateForInput(eventDate);
        
        document.getElementById('updateEventSlots').value = event.totalSlots;
        document.getElementById('updateEventAvailableSlots').value = event.availableSlots;
        document.getElementById('updateEventLocal').value = event.local || '';
        // Treat undefined as active to match backend default
        document.getElementById('updateEventIsActive').checked = event.isActive !== false;

        updateEventError.classList.add('d-none');

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('eventDetailsModal'));
        modal.show();
    } catch (error) {
        alert('Erro ao carregar detalhes do evento: ' + error.message);
    }
}

// Update event form submission
submitUpdateEventBtn.addEventListener('click', async () => {
    const title = document.getElementById('updateEventTitle').value.trim();
    const description = document.getElementById('updateEventDescription').value.trim();
    const dateTime = document.getElementById('updateEventDateTime').value;
    const totalSlots = parseInt(document.getElementById('updateEventSlots').value);
    const local = document.getElementById('updateEventLocal').value.trim();
    const isActive = document.getElementById('updateEventIsActive').checked;

    if (!title || !description || !dateTime || !totalSlots) {
        showError(updateEventError, 'Todos os campos são obrigatórios');
        return;
    }

    if (totalSlots < 1) {
        showError(updateEventError, 'O número de vagas deve ser pelo menos 1');
        return;
    }

    try {
        submitUpdateEventBtn.disabled = true;
        submitUpdateEventBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Atualizando...';

        const requestBody = {
            title,
            description,
            dateTime: convertLocalDateTimeToISO(dateTime),
            totalSlots,
            local,
            isActive
        };

        const response = await fetch(`${API_URL}/api/events/${currentEventId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao atualizar evento';
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
        updateEventError.classList.add('d-none');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('eventDetailsModal'));
        modal.hide();

        // Reload events
        await loadEvents();

        alert('Evento atualizado com sucesso!');
    } catch (error) {
        showError(updateEventError, error.message);
    } finally {
        submitUpdateEventBtn.disabled = false;
        submitUpdateEventBtn.innerHTML = 'Atualizar';
    }
});

// Delete event
deleteEventBtn.addEventListener('click', async () => {
    if (!confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        deleteEventBtn.disabled = true;
        deleteEventBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Excluindo...';

        const response = await fetch(`${API_URL}/api/events/${currentEventId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao excluir evento';
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
        const modal = bootstrap.Modal.getInstance(document.getElementById('eventDetailsModal'));
        modal.hide();

        // Reload events
        await loadEvents();

        alert('Evento excluído com sucesso!');
    } catch (error) {
        alert('Erro ao excluir evento: ' + error.message);
    } finally {
        deleteEventBtn.disabled = false;
        deleteEventBtn.innerHTML = '<i class="bi bi-trash"></i> Excluir';
    }
});

// View participants button
viewParticipantsBtn.addEventListener('click', async () => {
    openParticipantsModal(currentEventId);
});

// Register participant button - opens the register participant modal
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'registerParticipantBtn') {
        openRegisterParticipantModal();
    }
});

// Open participants modal
async function openParticipantsModal(eventId) {
    await loadParticipants(eventId);
    
    // Show participants modal
    const modal = new bootstrap.Modal(document.getElementById('participantsModal'));
    modal.show();
}

// Load participants data (can be called without opening modal)
async function loadParticipants(eventId) {
    try {
        const participantsLoading = document.getElementById('participantsLoading');
        const participantsContainer = document.getElementById('participantsContainer');
        const noParticipants = document.getElementById('noParticipants');
        const participantsSearchInput = document.getElementById('participantsSearchInput');
        const clearParticipantsSearchBtn = document.getElementById('clearParticipantsSearchBtn');

        participantsLoading.classList.remove('d-none');
        participantsContainer.classList.add('d-none');
        noParticipants.classList.add('d-none');

        const response = await fetch(`${API_URL}/api/events/${eventId}/participants`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            participantsLoading.classList.add('d-none');
            let errorMessage = 'Erro ao carregar participantes';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }

        const participants = await response.json();
        participantsLoading.classList.add('d-none');

        if (!Array.isArray(participants) || participants.length === 0) {
            noParticipants.classList.remove('d-none');
        } else {
            allParticipants = participants;
            filteredParticipants = participants;
            participantsContainer.classList.remove('d-none');
            
            // Clear previous search
            participantsSearchInput.value = '';
            
            // Setup search functionality
            participantsSearchInput.removeEventListener('input', handleParticipantsSearch);
            participantsSearchInput.addEventListener('input', handleParticipantsSearch);
            
            clearParticipantsSearchBtn.removeEventListener('click', handleClearParticipantsSearch);
            clearParticipantsSearchBtn.addEventListener('click', handleClearParticipantsSearch);
            
            displayParticipantsPage(1);
        }
    } catch (error) {
        alert('Erro ao carregar participantes: ' + error.message);
    }
}

// Handle participants search
function handleParticipantsSearch() {
    filterAndDisplayParticipants();
}

// Handle clear participants search
function handleClearParticipantsSearch() {
    const participantsSearchInput = document.getElementById('participantsSearchInput');
    participantsSearchInput.value = '';
    filterAndDisplayParticipants();
}

// Filter participants based on search query
function filterAndDisplayParticipants() {
    const participantsSearchInput = document.getElementById('participantsSearchInput');
    const searchQuery = participantsSearchInput.value.toLowerCase().trim();
    
    if (searchQuery === '') {
        filteredParticipants = allParticipants;
    } else {
        filteredParticipants = allParticipants.filter(participant => 
            participant.name.toLowerCase().includes(searchQuery) ||
            participant.email.toLowerCase().includes(searchQuery) ||
            participant.phone.toLowerCase().includes(searchQuery)
        );
    }
    
    if (filteredParticipants.length === 0) {
        const participantsTableBody = document.getElementById('participantsTableBody');
        participantsTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum participante encontrado.</td></tr>';
        const participantsPagination = document.getElementById('participantsPagination');
        participantsPagination.innerHTML = '';
        return;
    }
    
    currentParticipantsPage = 1; // Reset to first page when filtering
    displayParticipantsPage(currentParticipantsPage);
}

// Display participants page
function displayParticipantsPage(page) {
    currentParticipantsPage = page;
    const participantsTableBody = document.getElementById('participantsTableBody');
    participantsTableBody.innerHTML = '';

    const startIndex = (page - 1) * participantsPerPage;
    const endIndex = startIndex + participantsPerPage;
    const pageParticipants = filteredParticipants.slice(startIndex, endIndex);

    pageParticipants.forEach(participant => {
        const row = document.createElement('tr');
        
        const registeredDate = new Date(participant.registeredAt);
        const formattedDate = registeredDate.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        row.innerHTML = `
            <td>${escapeHtml(participant.name)}</td>
            <td>${escapeHtml(participant.email)}</td>
            <td>${escapeHtml(participant.phone)}</td>
            <td>${formattedDate}</td>
            <td>
                <button class="btn btn-sm btn-danger remove-participant-btn" data-registration-id="${participant.id}">
                    <i class="bi bi-trash"></i> Remover
                </button>
            </td>
        `;

        // Add event listener for remove button
        const removeBtn = row.querySelector('.remove-participant-btn');
        removeBtn.addEventListener('click', () => {
            removeParticipant(participant.id, participant.name);
        });

        participantsTableBody.appendChild(row);
    });

    renderParticipantsPagination();
}

// Render participants pagination
function renderParticipantsPagination() {
    const totalPages = Math.ceil(filteredParticipants.length / participantsPerPage);
    const participantsPagination = document.getElementById('participantsPagination');
    participantsPagination.innerHTML = '';

    if (totalPages <= 1) {
        return;
    }

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentParticipantsPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    if (currentParticipantsPage > 1) {
        prevLi.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            displayParticipantsPage(currentParticipantsPage - 1);
        });
    }
    participantsPagination.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentParticipantsPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageLi.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            displayParticipantsPage(i);
        });
        participantsPagination.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentParticipantsPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    if (currentParticipantsPage < totalPages) {
        nextLi.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            displayParticipantsPage(currentParticipantsPage + 1);
        });
    }
    participantsPagination.appendChild(nextLi);
}

// Remove participant
async function removeParticipant(registrationId, participantName) {
    if (!confirm(`Tem certeza que deseja remover ${participantName} deste evento?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/registrations/${registrationId}/cancel`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                eventId: currentEventId
            })
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao remover participante';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }

        // Success - reload participants list
        alert(`${participantName} foi removido com sucesso!`);
        await loadParticipants(currentEventId);
    } catch (error) {
        alert('Erro ao remover participante: ' + error.message);
    }
}

// Open register participant modal
function openRegisterParticipantModal() {
    // Clear form
    document.getElementById('registerParticipantForm').reset();
    const registerParticipantError = document.getElementById('registerParticipantError');
    registerParticipantError.classList.add('d-none');
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('registerParticipantModal'));
    modal.show();
}

// Submit register participant form
document.getElementById('submitRegisterParticipant').addEventListener('click', async () => {
    const name = document.getElementById('participantName').value.trim();
    const email = document.getElementById('participantEmail').value.trim();
    const phone = document.getElementById('participantPhone').value.trim();
    const registerParticipantError = document.getElementById('registerParticipantError');
    const submitBtn = document.getElementById('submitRegisterParticipant');

    if (!name || !email || !phone) {
        showError(registerParticipantError, 'Todos os campos são obrigatórios');
        return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError(registerParticipantError, 'Por favor, insira um email válido');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Inscrevendo...';

        const response = await fetch(`${API_URL}/api/registrations`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                eventId: currentEventId,
                name,
                email,
                phone
            })
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao inscrever participante';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }

        // Success
        registerParticipantError.classList.add('d-none');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('registerParticipantModal'));
        modal.hide();

        // Show success message
        alert(`${name} foi inscrito com sucesso!`);
        
        // Reload participants list (without reopening modal)
        await loadParticipants(currentEventId);
        
        // Reload events to update available slots
        await loadEvents();
    } catch (error) {
        showError(registerParticipantError, error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Inscrever';
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
