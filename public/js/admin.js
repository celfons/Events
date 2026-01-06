// API Base URL
const API_URL = window.location.origin;

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

// Participants pagination
let currentParticipantsPage = 1;
const participantsPerPage = 10;
let allParticipants = [];
let filteredParticipants = [];

// Load events on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    
    // Event search functionality
    searchInput.addEventListener('input', () => {
        filterAndDisplayEvents();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterAndDisplayEvents();
    });
});

// Load all events
async function loadEvents() {
    try {
        loadingElement.classList.remove('d-none');
        eventsTableContainer.classList.add('d-none');
        noEventsElement.classList.add('d-none');

        const response = await fetch(`${API_URL}/api/events`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar eventos');
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

// Filter events based on search query
function filterAndDisplayEvents() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    
    if (searchQuery === '') {
        filteredEvents = allEvents;
    } else {
        filteredEvents = allEvents.filter(event => 
            event.title.toLowerCase().includes(searchQuery)
        );
    }
    
    if (filteredEvents.length === 0) {
        eventsTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum evento encontrado.</td></tr>';
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

    row.innerHTML = `
        <td>${escapeHtml(event.title)}</td>
        <td>${formattedDate}</td>
        <td>${event.availableSlots}</td>
        <td>${event.totalSlots}</td>
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

// Create event form submission
submitCreateEventBtn.addEventListener('click', async () => {
    const title = document.getElementById('eventTitle').value.trim();
    const description = document.getElementById('eventDescription').value.trim();
    const dateTime = document.getElementById('eventDateTime').value;
    const totalSlots = parseInt(document.getElementById('eventSlots').value);

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

        const response = await fetch(`${API_URL}/api/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                dateTime,
                totalSlots
            })
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
        const response = await fetch(`${API_URL}/api/events/${eventId}`);
        
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
        currentEventId = eventId;

        // Populate form fields
        document.getElementById('updateEventTitle').value = event.title;
        document.getElementById('updateEventDescription').value = event.description;
        
        // Format date for datetime-local input
        const eventDate = new Date(event.dateTime);
        const formattedDateTime = eventDate.toISOString().slice(0, 16);
        document.getElementById('updateEventDateTime').value = formattedDateTime;
        
        document.getElementById('updateEventSlots').value = event.totalSlots;
        document.getElementById('updateEventAvailableSlots').value = event.availableSlots;

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

        const response = await fetch(`${API_URL}/api/events/${currentEventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                dateTime,
                totalSlots
            })
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
            method: 'DELETE'
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

// Open participants modal
async function openParticipantsModal(eventId) {
    try {
        const participantsLoading = document.getElementById('participantsLoading');
        const participantsContainer = document.getElementById('participantsContainer');
        const noParticipants = document.getElementById('noParticipants');
        const participantsSearchInput = document.getElementById('participantsSearchInput');
        const clearParticipantsSearchBtn = document.getElementById('clearParticipantsSearchBtn');

        participantsLoading.classList.remove('d-none');
        participantsContainer.classList.add('d-none');
        noParticipants.classList.add('d-none');

        const response = await fetch(`${API_URL}/api/events/${eventId}/participants`);

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

        // Show participants modal
        const modal = new bootstrap.Modal(document.getElementById('participantsModal'));
        modal.show();
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
        participantsTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum participante encontrado.</td></tr>';
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
        `;

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
