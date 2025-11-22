import { api, refreshCsrfToken } from '@/lib/api';
import { AuthStorage } from '@/lib/auth-storage';
import { User } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface CheckEmailResponse {
  exists: boolean;
  isActive?: boolean;
  hasPassword?: boolean;
}

export interface VerifyOtpCredentials {
  email: string;
  token: string;
}

/**
 * Authentication Service
 * Encapsulates all authentication-related API calls and token management
 * Reduces coupling between UI components and authentication logic
 */
export class AuthService {
  private static readonly BASE_URL = '/api/v1/auth';

  /**
   * Login with email and password
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
      `${this.BASE_URL}/login`,
      credentials
    );

    // Store token and user data using centralized utility
    AuthStorage.saveAuthData(response.data.accessToken, response.data.user);

    return response.data;
  }

  /**
   * Verify OTP for client authentication
   */
  static async verifyOtp(
    credentials: VerifyOtpCredentials
  ): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
      `${this.BASE_URL}/verify-otp`,
      credentials
    );

    // Store token and user data using centralized utility
    AuthStorage.saveAuthData(response.data.accessToken, response.data.user);

    return response.data;
  }

  /**
   * Check if email exists in the system
   */
  static async checkEmail(email: string): Promise<CheckEmailResponse> {
    const response = await api.post<CheckEmailResponse>(
      `${this.BASE_URL}/check-email`,
      { email }
    );
    return response.data;
  }

  /**
   * Request OTP for client authentication
   */
  static async requestOtp(email: string): Promise<void> {
    await api.post(`${this.BASE_URL}/request-otp`, { email });
  }

  /**
   * Request password reset
   */
  static async forgotPassword(email: string): Promise<void> {
    await api.post(`${this.BASE_URL}/forgot-password`, { email });
  }

  /**
   * Reset password with OTP token
   */
  static async resetPassword(data: {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await api.post(`${this.BASE_URL}/reset-password`, data);
  }

  /**
   * Change current user password
   */
  static async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await api.post(`${this.BASE_URL}/change-password`, data);
  }

  /**
   * Set initial password for user
   */
  static async setPassword(data: {
    password: string;
    confirmPassword: string;
  }): Promise<void> {
    await api.post(`${this.BASE_URL}/set-password`, data);
  }

  /**
   * Logout and clear stored tokens
   */
  static logout(): void {
    AuthStorage.clearAuthData();
    refreshCsrfToken(); // Refresh CSRF token after logout
  }

  /**
   * Get current user from storage
   */
  static getCurrentUser(): User | null {
    return AuthStorage.getCurrentUser();
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return AuthStorage.hasUserData();
  }
}
