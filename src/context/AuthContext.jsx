import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerUser, loginUser, fetchCurrentUser } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('careerforge_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('careerforge_token');
      if (storedToken) {
        try {
          const userData = await fetchCurrentUser();
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('Session initialization failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    const authData = await loginUser(credentials);
    localStorage.setItem('careerforge_token', authData.token);
    setToken(authData.token);
    setUser(authData.user);
    return authData;
  };

  const register = async (userData) => {
    const authData = await registerUser(userData);
    localStorage.setItem('careerforge_token', authData.token);
    setToken(authData.token);
    setUser(authData.user);
    return authData;
  };

  const logout = () => {
    localStorage.removeItem('careerforge_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
