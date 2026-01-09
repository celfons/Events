// API Base URL
const API_URL = window.location.origin;

// Get event ID from URL
const eventId = window.location.pathname.split('/').pop();

// DOM Elements
const loadingElement = document.getElementById('loading');
const eventDetailsContainer = document.getElementById('eventDetailsContainer');
const errorContainer = document.getElementById('errorContainer');
const registerForm = document.getElementById('registerForm');
const confirmForm = document.getElementById('confirmForm');
const registrationError = document.getElementById('registrationError');
const verificationError = document.getElementById('verificationError');
const registrationForm = document.getElementById('registrationForm');
const verificationForm = document.getElementById('verificationForm');
const registrationSuccess = document.getElementById('registrationSuccess');

// Store registration ID and participant ID
let currentRegistrationId = null;
let currentParticipantId = null;

// Storage key for registration data
const STORAGE_KEY_PREFIX = 'event_registration_';

// Helper function to create safe storage key
function getStorageKey() {
    // Validate and sanitize eventId to prevent injection or collisions
    if (!eventId || typeof eventId !== 'string') {
        return null;
    }
    // Remove any characters that could cause issues, keep alphanumeric, dash, underscore
    const sanitizedEventId = eventId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitizedEventId) {
        return null;
    }
    return STORAGE_KEY_PREFIX + sanitizedEventId;
}

// Load event details on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEventDetails();
    restoreRegistrationState();
});

// Restore registration state from localStorage
function restoreRegistrationState() {
    try {
        const storageKey = getStorageKey();
        if (!storageKey) {
            console.error('Invalid event ID, cannot restore state');
            return;
        }
        
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
            try {
                const registrationData = JSON.parse(storedData);
                
                // Validate required fields exist
                if (!registrationData || 
                    typeof registrationData.registrationId !== 'string' || 
                    !registrationData.registrationId) {
                    console.error('Invalid registration data structure');
                    localStorage.removeItem(storageKey);
                    return;
                }
                
                currentRegistrationId = registrationData.registrationId;
                currentParticipantId = registrationData.participantId;
                
                // Check registration status
                if (registrationData.status === 'pending') {
                    // Show verification form
                    registrationForm.classList.add('d-none');
                    verificationForm.classList.remove('d-none');
                    registrationSuccess.classList.add('d-none');
                } else if (registrationData.status === 'confirmed') {
                    // Show cancellation button
                    registrationForm.classList.add('d-none');
                    verificationForm.classList.add('d-none');
                    registrationSuccess.classList.remove('d-none');
                }
                
                // Restore form data - check elements exist before setting values
                const nameInput = document.getElementById('name');
                const emailInput = document.getElementById('email');
                const phoneInput = document.getElementById('phone');
                
                if (nameInput && registrationData.name) {
                    nameInput.value = registrationData.name;
                }
                if (emailInput && registrationData.email) {
                    emailInput.value = registrationData.email;
                }
                if (phoneInput && registrationData.phone) {
                    phoneInput.value = registrationData.phone;
                }
            } catch (parseError) {
                console.error('Error parsing registration data:', parseError);
                // Clear invalid data
                try {
                    localStorage.removeItem(storageKey);
                } catch (removeError) {
                    console.error('Error removing invalid data:', removeError);
                }
            }
        }
    } catch (error) {
        // Handle localStorage access errors (disabled, private mode, etc.)
        console.error('Error accessing localStorage:', error);
    }
}

// Save registration state to localStorage
function saveRegistrationState(registrationId, participantId, name, email, phone, status = 'pending') {
    try {
        const storageKey = getStorageKey();
        if (!storageKey) {
            console.error('Invalid event ID, cannot save state');
            return;
        }
        
        // Validate input parameters
        if (!registrationId || typeof registrationId !== 'string') {
            console.error('Invalid registration ID');
            return;
        }
        
        const registrationData = {
            registrationId,
            participantId: participantId || null,
            eventId,
            name: name || '',
            email: email || '',
            phone: phone || '',
            status: status,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify(registrationData));
    } catch (error) {
        // Handle localStorage errors (quota exceeded, disabled, etc.)
        console.error('Error saving registration state:', error);
        // Continue execution - the app still works without persistence
    }
}

// Clear registration state from localStorage
function clearRegistrationState() {
    try {
        const storageKey = getStorageKey();
        if (!storageKey) {
            console.error('Invalid event ID, cannot clear state');
            return;
        }
        localStorage.removeItem(storageKey);
    } catch (error) {
        // Handle localStorage errors
        console.error('Error clearing registration state:', error);
        // Continue execution - not critical if clear fails
    }
}

// Load event details
async function loadEventDetails() {
    try {
        loadingElement.classList.remove('d-none');
        eventDetailsContainer.classList.add('d-none');
        errorContainer.classList.add('d-none');

        const response = await fetch(`${API_URL}/api/events/${eventId}`);
        
        if (!response.ok) {
            let errorMessage = 'Erro ao carregar detalhes do evento';
            try {
                const error = await response.json();
                errorMessage = error.error?.message || error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }

        const responseData = await response.json();
        
        // Extract event data from the response data object
        if (!responseData || !responseData.data) {
            throw new Error('Evento não encontrado');
        }
        
        const event = responseData.data;
        
        displayEventDetails(event);
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
    
    document.getElementById('eventSlots').className = `badge bg-${slotsColor} me-2`;
    document.getElementById('eventSlots').innerHTML = `<i class="bi bi-people"></i> ${slotsText}`;
    
    // Display event code
    const eventCodeElement = document.getElementById('eventCode');
    if (event.eventCode) {
        eventCodeElement.innerHTML = `<i class="bi bi-tag-fill"></i> ${event.eventCode}`;
        eventCodeElement.style.display = 'inline-block';
    } else {
        eventCodeElement.style.display = 'none';
    }
    
    // Display location if available
    const eventDateElement = document.getElementById('eventDate');
    if (eventDateElement && eventDateElement.parentElement) {
        const badgesContainer = eventDateElement.parentElement;
        
        // Remove existing location badge if present
        const existingLocationBadge = badgesContainer.querySelector('.event-location-badge');
        if (existingLocationBadge) {
            existingLocationBadge.remove();
        }
        
        // Add new location badge if location is provided
        if (event.local) {
            const locationBadge = document.createElement('span');
            locationBadge.className = 'badge bg-secondary ms-2 event-location-badge';
            const icon = document.createElement('i');
            icon.className = 'bi bi-geo-alt';
            locationBadge.appendChild(icon);
            locationBadge.appendChild(document.createTextNode(' ' + event.local));
            badgesContainer.appendChild(locationBadge);
        }
    }
    
    // Setup share button
    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
        shareButton.onclick = () => shareEvent(event);
    }

    // Update registration button state based on available slots
    const registerButton = document.getElementById('registerButton');
    if (event.availableSlots === 0) {
        registerButton.disabled = true;
        registerButton.innerHTML = '<i class="bi bi-x-circle"></i> Vagas Esgotadas';
    } else {
        registerButton.disabled = false;
        registerButton.innerHTML = '<i class="bi bi-check-circle"></i> Inscrever-se';
    }
}

// Share event function
function shareEvent(event) {
    const eventUrl = window.location.href;
    const shareText = `Confira este evento: ${event.title}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: event.title,
            text: shareText,
            url: eventUrl
        }).catch(error => {
            console.log('Error sharing:', error);
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(eventUrl).then(() => {
            alert('Link do evento copiado para a área de transferência!');
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
            // Final fallback: show a prompt with the URL
            prompt('Copie o link do evento:', eventUrl);
        });
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

        if (!response.ok) {
            let errorMessage = 'Erro ao realizar inscrição';
            try {
                const error = await response.json();
                errorMessage = error.error?.message || error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        // Success - API returns { data: RegistrationResponse }
        // Save as pending registration
        currentRegistrationId = data.data.id;
        currentParticipantId = data.data.id; // Use the registration ID as participant ID
        
        // Save registration state to localStorage with pending status
        saveRegistrationState(data.data.id, data.data.id, name, email, phone, 'pending');
        
        // Show verification form
        registrationForm.classList.add('d-none');
        verificationForm.classList.remove('d-none');
        registrationError.classList.add('d-none');
    } catch (error) {
        showError(registrationError, error.message);
        const registerButton = document.getElementById('registerButton');
        registerButton.disabled = false;
        registerButton.innerHTML = '<i class="bi bi-check-circle"></i> Inscrever-se';
    }
});

// Handle verification form submission
confirmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const verificationCode = document.getElementById('verificationCode').value.trim();

    if (!verificationCode || verificationCode.length !== 6) {
        showError(verificationError, 'Digite um código de 6 dígitos');
        return;
    }

    if (!currentRegistrationId || !currentParticipantId) {
        showError(verificationError, 'Erro: dados de inscrição não encontrados');
        return;
    }

    try {
        const confirmButton = document.getElementById('confirmButton');
        confirmButton.disabled = true;
        confirmButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Confirmando...';

        const response = await fetch(`${API_URL}/api/registrations/${currentParticipantId}/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventId,
                verificationCode
            })
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao confirmar inscrição';
            try {
                const error = await response.json();
                errorMessage = error.error?.message || error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        // Success - update status to confirmed
        const storageKey = getStorageKey();
        if (storageKey) {
            const storedData = localStorage.getItem(storageKey);
            if (storedData) {
                const registrationData = JSON.parse(storedData);
                registrationData.status = 'confirmed';
                localStorage.setItem(storageKey, JSON.stringify(registrationData));
            }
        }
        
        // Show success message
        verificationForm.classList.add('d-none');
        registrationSuccess.classList.remove('d-none');
        verificationError.classList.add('d-none');

        // Reload event details to update available slots
        await loadEventDetails();
    } catch (error) {
        showError(verificationError, error.message);
        const confirmButton = document.getElementById('confirmButton');
        confirmButton.disabled = false;
        confirmButton.innerHTML = '<i class="bi bi-check-circle-fill"></i> Confirmar Inscrição';
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
            },
            body: JSON.stringify({
                eventId
            })
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao cancelar inscrição';
            try {
                const error = await response.json();
                errorMessage = error.error?.message || error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

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

// Helper function for back navigation
function handleBackNavigation() {
    // Use browser history to go back, or fallback to home page
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/';
    }
}

// Handle back button clicks
document.getElementById('backButton')?.addEventListener('click', handleBackNavigation);
document.getElementById('backButtonSuccess')?.addEventListener('click', handleBackNavigation);
document.getElementById('backToFormButton')?.addEventListener('click', () => {
    // Go back to registration form, clear verification form
    verificationForm.classList.add('d-none');
    registrationForm.classList.remove('d-none');
    document.getElementById('verificationCode').value = '';
    verificationError.classList.add('d-none');
    
    // Clear the pending registration from localStorage
    clearRegistrationState();
    currentRegistrationId = null;
    currentParticipantId = null;
});

// Helper function
function showError(element, message) {
    element.textContent = message;
    element.classList.remove('d-none');
}
