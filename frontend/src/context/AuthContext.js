import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/users/current/', {
        withCredentials: true
      });
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(
        '/api/users/login/',
        { username, password },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        // Проверяем авторизацию еще раз для уверенности
        await checkAuth();
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Не удалось получить данные пользователя'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Ошибка входа'
      };
    }
  };

  const register = async (username, password) => {
    try {
      const response = await axios.post(
        '/api/users/register/',
        { username, password },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        // Проверяем авторизацию еще раз для уверенности
        await checkAuth();
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Не удалось получить данные пользователя'
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Ошибка регистрации'
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/users/logout/', {}, { withCredentials: true });
    } catch (error) {
      console.error('Ошибка выхода:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

