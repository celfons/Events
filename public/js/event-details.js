// API Base URL
const API_URL = window.location.origin;

// Get event ID from URL
const eventId = window.location.pathname.split('/').pop();

// DOM Elements
const loadingElement = document.getElementById('loading');
const eventDetailsContainer = document.getElementById('eventDetailsContainer');
const errorContainer = document.getElementById('errorContainer');
const registerForm = document.getElementById('registerForm');
const registrationError = document.getElementById('registrationError');
const registrationForm = document.getElementById('registrationForm');
const registrationSuccess = document.getElementById('registrationSuccess');

// Store registration ID
let currentRegistrationId = null;

// Storage key for registration data
const STORAGE_KEY_PREFIX = 'event_registration_';

// Load event details on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEventDetails();
    restoreRegistrationState();
});

// Restore registration state from localStorage
function restoreRegistrationState() {
    const storageKey = STORAGE_KEY_PREFIX + eventId;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
        try {
            const registrationData = JSON.parse(storedData);
            currentRegistrationId = registrationData.registrationId;
            
            // Restore form data
            if (registrationData.name) {
                document.getElementById('name').value = registrationData.name;
            }
            if (registrationData.email) {
                document.getElementById('email').value = registrationData.email;
            }
            if (registrationData.phone) {
                document.getElementById('phone').value = registrationData.phone;
            }
            
            // Show cancellation button
            registrationForm.classList.add('d-none');
            registrationSuccess.classList.remove('d-none');
        } catch (error) {
            console.error('Error restoring registration state:', error);
            // Clear invalid data
            localStorage.removeItem(storageKey);
        }
    }
}

// Save registration state to localStorage
function saveRegistrationState(registrationId, name, email, phone) {
    const storageKey = STORAGE_KEY_PREFIX + eventId;
    const registrationData = {
        registrationId,
        eventId,
        name,
        email,
        phone,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(registrationData));
}

// Clear registration state from localStorage
function clearRegistrationState() {
    const storageKey = STORAGE_KEY_PREFIX + eventId;
    localStorage.removeItem(storageKey);
}

// Load event details
async function loadEventDetails() {
    try {
        loadingElement.classList.remove('d-none');
        eventDetailsContainer.classList.add('d-none');
        errorContainer.classList.add('d-none');

        const response = await fetch(`${API_URL}/api/events/${eventId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao carregar detalhes do evento');
        }

        displayEventDetails(data.event);
        loadingElement.classList.add('d-none');
        eventDetailsContainer.classList.remove('d-none');
    } catch (error) {
        console.error('Error loading event details:', error);
        loadingElement.classList.add('d-none');
        errorContainer.textContent = error.message;
        errorContainer.classList.remove('d-none');
    }
}

// Display event details
function displayEventDetails(event) {
    const eventDate = new Date(event.dateTime);
    const formattedDate = eventDate.toLocaleString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    document.getElementById('eventTitle').textContent = event.title;
    document.getElementById('eventDescription').textContent = event.description;
    document.getElementById('eventDate').innerHTML = `<i class="bi bi-calendar"></i> ${formattedDate}`;
    
    const slotsColor = event.availableSlots > 10 ? 'success' : event.availableSlots > 0 ? 'warning' : 'danger';
    const slotsText = event.availableSlots > 0 
        ? `${event.availableSlots}/${event.totalSlots} vagas disponíveis` 
        : 'Esgotado';
    
    document.getElementById('eventSlots').className = `badge bg-${slotsColor}`;
    document.getElementById('eventSlots').innerHTML = `<i class="bi bi-people"></i> ${slotsText}`;

    // Disable registration if no slots available
    if (event.availableSlots === 0) {
        document.getElementById('registerButton').disabled = true;
        document.getElementById('registerButton').innerHTML = '<i class="bi bi-x-circle"></i> Vagas Esgotadas';
    }
}

// Handle registration form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!name || !email || !phone) {
        showError(registrationError, 'Todos os campos são obrigatórios');
        return;
    }

    try {
        const registerButton = document.getElementById('registerButton');
        registerButton.disabled = true;
        registerButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Inscrevendo...';

        const response = await fetch(`${API_URL}/api/registrations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventId,
                name,
                email,
                phone
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao realizar inscrição');
        }

        // Success
        currentRegistrationId = data.id;
        
        // Save registration state to localStorage
        saveRegistrationState(data.id, name, email, phone);
        
        registrationForm.classList.add('d-none');
        registrationSuccess.classList.remove('d-none');
        registrationError.classList.add('d-none');

        // Reload event details to update available slots
        await loadEventDetails();
    } catch (error) {
        showError(registrationError, error.message);
        const registerButton = document.getElementById('registerButton');
        registerButton.disabled = false;
        registerButton.innerHTML = '<i class="bi bi-check-circle"></i> Inscrever-se';
    }
});

// Handle registration cancellation
document.getElementById('cancelRegistrationButton')?.addEventListener('click', async () => {
    if (!currentRegistrationId) {
        alert('Erro: ID de inscrição não encontrado');
        return;
    }

    if (!confirm('Tem certeza que deseja cancelar sua inscrição?')) {
        return;
    }

    try {
        const cancelButton = document.getElementById('cancelRegistrationButton');
        cancelButton.disabled = true;
        cancelButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Cancelando...';

        const response = await fetch(`${API_URL}/api/registrations/${currentRegistrationId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao cancelar inscrição');
        }

        // Success
        registrationSuccess.classList.add('d-none');
        registrationForm.classList.remove('d-none');
        registerForm.reset();
        currentRegistrationId = null;
        
        // Clear registration state from localStorage
        clearRegistrationState();

        // Reload event details to update available slots
        await loadEventDetails();

        alert('Inscrição cancelada com sucesso!');
    } catch (error) {
        alert('Erro ao cancelar inscrição: ' + error.message);
        const cancelButton = document.getElementById('cancelRegistrationButton');
        cancelButton.disabled = false;
        cancelButton.innerHTML = '<i class="bi bi-x-circle"></i> Cancelar Inscrição';
    }
});

// Helper function
function showError(element, message) {
    element.textContent = message;
    element.classList.remove('d-none');
}
