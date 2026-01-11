import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, getUser, clearAuthData, saveToken as saveAuthToken } from '../utils/auth';
import { fetchWithTracing } from '../utils/apiClient';

// Create contexts
const AuthContext = createContext();
const ToastContext = createContext();

// Auth Provider
export function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    setToken(getToken());
    setUser(getUser());
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetchWithTracing(`${window.location.origin}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error?.message || error.error || 'Erro ao fazer login';
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      saveAuthToken(data.data.token, data.data.user);
      setToken(data.data.token);
      setUser(data.data.user);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    clearAuthData();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Toast Provider
let toastIdCounter = 0;

const createToastId = () => {
  return 'toast-' + Date.now() + '-' + (++toastIdCounter);
};

const addToastToList = (prev, toast) => {
  return [...prev, toast];
};

const removeToastFromList = (prev, id) => {
  return prev.filter(t => t.id !== id);
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', duration = 3000) => {
    const id = createToastId();
    const toast = { id, message, type, duration };
    
    setToasts(prev => addToastToList(prev, toast));

    setTimeout(() => {
      setToasts(prev => removeToastFromList(prev, id));
    }, duration);

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => removeToastFromList(prev, id));
  };

  const showSuccess = (message) => showToast(message, 'success');
  const showError = (message) => showToast(message, 'error');
  const showInfo = (message) => showToast(message, 'info');
  const showWarning = (message) => showToast(message, 'warning');

  return (
    <ToastContext.Provider value={{ 
      toasts, 
      showToast, 
      showSuccess, 
      showError, 
      showInfo, 
      showWarning, 
      removeToast 
    }}>
      {children}
    </ToastContext.Provider>
  );
}

// Combined App Provider
export function AppProvider({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}

// Custom hooks to use contexts
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}
