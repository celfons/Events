// Toast notification utilities using Bootstrap Toast

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'success', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    // Map type to Bootstrap color classes
    const colorMap = {
        success: 'bg-success text-white',
        error: 'bg-danger text-white',
        info: 'bg-info text-white',
        warning: 'bg-warning text-dark'
    };

    const iconMap = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        info: 'bi-info-circle-fill',
        warning: 'bi-exclamation-triangle-fill'
    };

    // Create toast element with unique ID
    const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    const bgClass = colorMap[type] || colorMap.success;
    const iconClass = iconMap[type] || iconMap.success;
    const titleText = type === 'error' ? 'Erro' : type === 'warning' ? 'Atenção' : type === 'info' ? 'Informação' : 'Sucesso';

    // Create toast structure
    const toastHeader = document.createElement('div');
    toastHeader.className = `toast-header ${bgClass}`;
    
    const icon = document.createElement('i');
    icon.className = `bi ${iconClass} me-2`;
    
    const title = document.createElement('strong');
    title.className = 'me-auto';
    title.textContent = titleText;
    
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = `btn-close ${type === 'warning' ? '' : 'btn-close-white'}`;
    closeButton.setAttribute('data-bs-dismiss', 'toast');
    closeButton.setAttribute('aria-label', 'Close');
    
    toastHeader.appendChild(icon);
    toastHeader.appendChild(title);
    toastHeader.appendChild(closeButton);
    
    const toastBody = document.createElement('div');
    toastBody.className = `toast-body ${bgClass}`;
    toastBody.textContent = message; // Use textContent to prevent XSS
    
    toastEl.appendChild(toastHeader);
    toastEl.appendChild(toastBody);

    toastContainer.appendChild(toastEl);

    // Initialize and show toast
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: duration
    });

    toast.show();

    // Remove toast element after it's hidden
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

/**
 * Shows a success toast
 * @param {string} message - The message to display
 */
function showSuccessToast(message) {
    showToast(message, 'success');
}

/**
 * Shows an error toast
 * @param {string} message - The message to display
 */
function showErrorToast(message) {
    showToast(message, 'error');
}

/**
 * Shows an info toast
 * @param {string} message - The message to display
 */
function showInfoToast(message) {
    showToast(message, 'info');
}

/**
 * Shows a warning toast
 * @param {string} message - The message to display
 */
function showWarningToast(message) {
    showToast(message, 'warning');
}
