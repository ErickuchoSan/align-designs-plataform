'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginCredentials, OTPRequest, OTPVerify, AuthResponse } from '@/types';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { AuthStorage } from '@/lib/auth-storage';

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
    // Load authentication data from storage
    const userData = AuthStorage.loadAuthData();
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials);

      // Validate response structure
      if (!data || !data.user || !data.user.id || !data.user.email) {
        logger.error('Invalid login response structure:', data);
        throw new Error('Invalid server response. Please try again.');
      }

      // Save user data (token is in httpOnly cookie, not in response)
      AuthStorage.saveAuthData('', data.user); // Empty token param (kept for API compat)
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

      // Validate response structure
      if (!data || !data.user || !data.user.id || !data.user.email) {
        logger.error('Invalid OTP verification response structure:', data);
        throw new Error('Invalid server response. Please try again.');
      }

      // Save user data (token is in httpOnly cookie, not in response)
      AuthStorage.saveAuthData('', data.user); // Empty token param (kept for API compat)
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
      // Clear authentication data using centralized utility
      AuthStorage.clearAuthData();
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
