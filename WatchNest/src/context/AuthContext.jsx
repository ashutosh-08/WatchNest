import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasCheckedAuth = useRef(false);

  // Check if user is already logged in
  useEffect(() => {
    if (hasCheckedAuth.current) {
      return;
    }
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      try {
        const res = await api.get('/users/current-user');
        if (res.data.data) {
          setUser(res.data.data);
        }
      } catch (err) {
        // User not authenticated
        setUser(null);
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = useCallback(async (fullName, email, password, avatar) => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('password', password);
      if (avatar) formData.append('avatar', avatar);

      const res = await api.post('/users/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Registration endpoint does not issue auth tokens.
      // Keep user logged out until explicit login succeeds.
      setUser(null);
      localStorage.removeItem('accessToken');
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw err;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const res = await api.post('/users/login', { email, password });
      const token = res?.data?.data?.accessToken;
      if (token) {
        localStorage.setItem('accessToken', token);
      }
      setUser(res.data.data.user);
      return res.data;
    } catch (err) {
      localStorage.removeItem('accessToken');
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setError(null);
      await api.post('/users/logout');
      setUser(null);
      localStorage.removeItem('accessToken');
    } catch (err) {
      const message = err.response?.data?.message || 'Logout failed';
      setError(message);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (fullName, email) => {
    try {
      setError(null);
      const res = await api.patch('/users/update-account', { fullName, email });
      setUser(res.data.data);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Update failed';
      setError(message);
      throw err;
    }
  }, []);

  const updateAvatar = useCallback(async (avatar) => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('avatar', avatar);

      const res = await api.patch('/users/update-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUser(res.data.data);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Avatar update failed';
      setError(message);
      throw err;
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    updateAvatar,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
