import { useState, useCallback } from 'react';

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = 'toast-' + Date.now() + '-' + ++toastIdCounter;
    const toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    // Auto remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showSuccess = useCallback(message => showToast(message, 'success'), [showToast]);
  const showError = useCallback(message => showToast(message, 'error'), [showToast]);
  const showInfo = useCallback(message => showToast(message, 'info'), [showToast]);
  const showWarning = useCallback(message => showToast(message, 'warning'), [showToast]);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeToast
  };
}
