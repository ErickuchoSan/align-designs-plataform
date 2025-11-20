'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginCredentials, OTPRequest, OTPVerify, AuthResponse } from '@/types';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { storage } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  requestOTP: (data: OTPRequest) => Promise<void>;
  verifyOTP: (data: OTPVerify) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only execute on the client
    if (typeof window !== 'undefined') {
      const token = storage.getItem('access_token');

      if (token) {
        const userResult = storage.getJSON<User>('user');

        if (userResult.success && userResult.data) {
          setUser(userResult.data);
        } else {
          // If user data is corrupted, clear everything
          logger.error('Error loading user from storage:', userResult.error);
          storage.removeItem('user');
          storage.removeItem('access_token');
        }
      }
      setLoading(false);
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials);

      if (typeof window !== 'undefined') {
        const tokenResult = storage.setItem('access_token', data.access_token);
        const userResult = storage.setJSON('user', data.user);

        if (!tokenResult.success || !userResult.success) {
          logger.error('Failed to save auth data to storage', {
            tokenError: tokenResult.error,
            userError: userResult.error,
          });
          // Continue anyway - user is logged in, just won't persist across sessions
          if (storage.usingFallback) {
            logger.warn('Using in-memory storage. Session will not persist on page reload.');
          }
        }
      }
      setUser(data.user);
    } catch (error) {
      logger.error('Error during login:', error);
      throw error;
    }
  };

  const requestOTP = async (otpData: OTPRequest) => {
    try {
      await api.post('/auth/otp/request', otpData);
    } catch (error) {
      logger.error('Error requesting OTP:', error);
      throw error;
    }
  };

  const verifyOTP = async (otpData: OTPVerify) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/otp/verify', otpData);

      if (typeof window !== 'undefined') {
        const tokenResult = storage.setItem('access_token', data.access_token);
        const userResult = storage.setJSON('user', data.user);

        if (!tokenResult.success || !userResult.success) {
          logger.error('Failed to save auth data to storage', {
            tokenError: tokenResult.error,
            userError: userResult.error,
          });
          if (storage.usingFallback) {
            logger.warn('Using in-memory storage. Session will not persist on page reload.');
          }
        }
      }
      setUser(data.user);
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint to clear httpOnly cookie
      await api.post('/auth/logout');
    } catch (error) {
      logger.error('Error during logout:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local storage (for backward compatibility)
      if (typeof window !== 'undefined') {
        storage.removeItem('access_token');
        storage.removeItem('user');
      }
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        requestOTP,
        verifyOTP,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
