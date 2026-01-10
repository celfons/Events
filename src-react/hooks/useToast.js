import { useState, useCallback } from 'react';

let toastIdCounter = 0;

const createToastId = () => {
  return 'toast-' + Date.now() + '-' + ++toastIdCounter;
};

const addToastToList = (prev, toast) => {
  return [...prev, toast];
};

const removeToastFromList = (prev, id) => {
  return prev.filter(t => t.id !== id);
};

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = createToastId();
    const toast = { id, message, type, duration };

    setToasts(prev => addToastToList(prev, toast));

    setTimeout(() => {
      setToasts(prev => removeToastFromList(prev, id));
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback(id => {
    setToasts(prev => removeToastFromList(prev, id));
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
