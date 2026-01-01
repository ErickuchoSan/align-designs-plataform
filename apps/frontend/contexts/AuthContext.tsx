'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  updateUser: (userData: Partial<User>) => void;
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

  // Memoize functions to prevent recreation on every render
  const login = useCallback(async (credentials: LoginCredentials) => {
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
  }, []);

  const requestOTP = useCallback(async (otpData: OTPRequest) => {
    try {
      await api.post('/auth/otp/request', otpData);
    } catch (error) {
      logger.error('Error requesting OTP:', error);
      throw error;
    }
  }, []);

  const verifyOTP = useCallback(async (otpData: OTPVerify) => {
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
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call backend logout endpoint to clear httpOnly cookie
      await api.post('/auth/logout');
    } catch (error: any) {
      // Distinguish between recoverable and non-recoverable errors
      const isNetworkError = error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK';
      const isServerError = error?.response?.status >= 500;

      if (isNetworkError) {
        logger.warn('Network error during logout - continuing with local cleanup', error);
      } else if (isServerError) {
        logger.warn('Server error during logout - continuing with local cleanup', error);
      } else {
        // For auth errors (401, 403) or other client errors, log but continue
        logger.error('Error during logout:', error);
      }

      // Always continue with local logout regardless of server response
      // This ensures users can always log out even if the server is unreachable
    } finally {
      // Clear authentication data using centralized utility
      AuthStorage.clearAuthData();
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    if (!user) {
      logger.warn('Attempted to update user when no user is logged in');
      return;
    }

    const updatedUser = { ...user, ...userData };
    AuthStorage.saveAuthData('', updatedUser);
    setUser(updatedUser);
  }, [user]);

  // Memoize context value to prevent unnecessary re-renders
  // Only recalculates when dependencies change
  const contextValue = useMemo(() => ({
    user,
    loading,
    login,
    requestOTP,
    verifyOTP,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  }), [user, loading, login, requestOTP, verifyOTP, logout, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
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

/**
 * Safe version of useAuth that can be used in components that may render outside AuthProvider
 * Returns null if used outside AuthProvider instead of throwing an error
 * Use this in error modals or other components that need to work in any context
 */
export function useAuthSafe() {
  const context = useContext(AuthContext);
  return context ?? null;
}
