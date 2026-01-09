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

    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    const bgClass = colorMap[type] || colorMap.success;
    const iconClass = iconMap[type] || iconMap.success;

    toastEl.innerHTML = `
        <div class="toast-header ${bgClass}">
            <i class="bi ${iconClass} me-2"></i>
            <strong class="me-auto">${type === 'error' ? 'Erro' : type === 'warning' ? 'Atenção' : type === 'info' ? 'Informação' : 'Sucesso'}</strong>
            <button type="button" class="btn-close ${type === 'warning' ? '' : 'btn-close-white'}" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body ${bgClass}">
            ${message}
        </div>
    `;

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
