'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, LoginCredentials, OTPRequest, OTPVerify } from '@/types';
import { logger } from '@/lib/logger';
import { AuthStorage } from '@/lib/auth-storage';
import { AuthService } from '@/services/auth.service';

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

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
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
      const response = await AuthService.login(credentials);
      setUser(response.user);
    } catch (error) {
      logger.error('Error during login:', error);
      throw error;
    }
  }, []);

  const requestOTP = useCallback(async (otpData: OTPRequest) => {
    try {
      await AuthService.requestOtp(otpData.email);
    } catch (error) {
      logger.error('Error requesting OTP:', error);
      throw error;
    }
  }, []);

  const verifyOTP = useCallback(async (otpData: OTPVerify) => {
    try {
      const response = await AuthService.verifyOtp({ email: otpData.email, token: otpData.token });
      setUser(response.user);
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } catch (error: unknown) {
      logger.error('Error during logout:', error);
    } finally {
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
