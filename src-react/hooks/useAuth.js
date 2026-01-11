import { useState, useEffect } from 'react';
import { getToken, getUser, clearAuthData, saveToken } from '../utils/auth';
import { fetchWithTracing } from '../utils/apiClient';

export function useAuth() {
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
        throw new Error(error.error?.message || error.error || 'Erro ao fazer login');
      }

      const data = await response.json();
      saveToken(data.data.token, data.data.user);
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

  return {
    token,
    user,
    isAuthenticated: !!token,
    login,
    logout
  };
}
