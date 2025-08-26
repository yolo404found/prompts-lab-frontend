// providers/AuthProvider.tsx
import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../../types';
import apiService from '../../services/api';
import { AuthContext } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const checkAuth = async () => {
    try {
      const token = getStoredToken();
      console.log('Checking auth, token found:', !!token);
      if (token) {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        console.log('User authenticated:', userData.email);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      removeStoredToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Login attempt for:', email);
      const response = await apiService.login({ email, password });
      console.log('Login response received:', response);
      const { user: userData, token } = response;
      console.log('Extracted user data:', userData);
      console.log('Extracted token:', token ? token.substring(0, 20) + '...' : 'null');
      setUser(userData);
      storeToken(token);
      console.log('Login completed successfully');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, full_name?: string) => {
    try {
      const response = await apiService.signup({ email, password, name: full_name });
      const { user: userData, token } = response;
      setUser(userData);
      storeToken(token);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    removeStoredToken();
  };

  const storeToken = (token: string) => {
    console.log('🔐 storeToken called with token:', token ? token.substring(0, 20) + '...' : 'null');
    if (!token) {
      console.error('❌ storeToken called with null/undefined token!');
      return;
    }
    sessionStorage.setItem('auth_token', token);
    console.log('🔐 Token stored in sessionStorage. Current value:', sessionStorage.getItem('auth_token') ? 'present' : 'missing');
    console.log('🔐 Token length:', token.length);
    console.log('🔐 Token starts with:', token.substring(0, 10));
  };

  const getStoredToken = (): string | null => {
    const token = sessionStorage.getItem('auth_token');
    console.log('🔐 Getting stored token:', token ? token.substring(0, 20) + '...' : 'null');
    if (token) {
      console.log('🔐 Token length:', token.length);
      console.log('🔐 Token starts with:', token.substring(0, 10));
    }
    return token;
  };

  const removeStoredToken = () => {
    console.log('🗑️ Removing stored token');
    sessionStorage.removeItem('auth_token');
    console.log('🗑️ Token removed. Current value:', sessionStorage.getItem('auth_token') ? 'present' : 'missing');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};