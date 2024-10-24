import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCurrentUser, useLogin, useLogout } from '../api/queries';
import { User } from '../models/models';
import axios from 'axios';
import { notifications } from '@mantine/notifications';

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { data: user, isLoading, refetch } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);
  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   if (token) {
  //     refetch();
  //   }
  // }, []);

 
  
  const login = async (phone: string, password: string) => {
    try {
      const response = await axios.post('https://globus-nukus.uz/api/token', {
        phone,
        password,
      });

      if (response.data && response.data.success) {
        localStorage.setItem('token', response.data.data.token.access);
        localStorage.setItem('refreshToken', response.data.data.token.refresh);
        await refetch();
        return response.data.data.user;
      } else {
        throw new Error(response.data.errMessage || 'Login failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Login error:', error.response.data);
        notifications.show({
          title: 'Login Failed',
          message: error.response?.data?.errMessage || 'Invalid credentials. Please try again.',
          color: 'red',
        });
      } else {
        console.error('Login error:', error);
        notifications.show({
          title: 'Login Failed',
          message: 'An unexpected error occurred. Please try again later.',
          color: 'red',
        });
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
      await refetch();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user: user || null, login, logout, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};