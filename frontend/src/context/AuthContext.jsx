import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify session on initial application load
  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authService.getMe();
      if (res && res.data) {
        const userObj = res.data.user || res.data;
        setUser(userObj);
        setToken(storedToken);
      } else {
        throw new Error('Data user tidak valid.');
      }
    } catch (error) {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const receivedToken = res.data.token;
    const receivedUser = res.data.user;

    localStorage.setItem('auth_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Ignored: Local cleanup must still execute even if network fails
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      if (res && res.data) {
        const userObj = res.data.user || res.data;
        setUser(userObj);
      }
    } catch (err) {
      // If refresh fails due to invalidated token, clear session
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      }
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    refreshUser,
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
