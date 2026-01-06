// API Base URL
const API_URL = window.location.origin;

// DOM Elements
const eventsContainer = document.getElementById('eventsContainer');
const loadingElement = document.getElementById('loading');
const noEventsElement = document.getElementById('noEvents');
const createEventForm = document.getElementById('createEventForm');
const submitCreateEventBtn = document.getElementById('submitCreateEvent');
const createEventError = document.getElementById('createEventError');

// Load events on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
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

        if (!Array.isArray(events) || events.length === 0) {
            noEventsElement.classList.remove('d-none');
            return;
        }

        events.forEach(event => {
            eventsContainer.appendChild(createEventCard(event));
        });
    } catch (error) {
        console.error('Error loading events:', error);
        loadingElement.classList.add('d-none');
        eventsContainer.innerHTML = '<div class="alert alert-danger">Erro ao carregar eventos. Tente novamente mais tarde.</div>';
    }
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

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao criar evento');
        }

        // Success
        createEventForm.reset();
        createEventError.classList.add('d-none');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createEventModal'));
        modal.hide();

        // Reload events
        await loadEvents();

        // Show success message
        showSuccessToast('Evento criado com sucesso!');
    } catch (error) {
        showError(createEventError, error.message);
    } finally {
        submitCreateEventBtn.disabled = false;
        submitCreateEventBtn.innerHTML = 'Criar Evento';
    }
});

// Helper functions
function showError(element, message) {
    element.textContent = message;
    element.classList.remove('d-none');
}

function showSuccessToast(message) {
    // Simple alert for now - could be replaced with a toast component
    alert(message);
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
