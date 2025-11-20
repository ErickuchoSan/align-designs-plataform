import { Role } from '@prisma/client';

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: Role;
    firstName: string;
    lastName: string;
  };
}

export interface VerifyOtpResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: Role;
    firstName: string;
    lastName: string;
  };
}

export interface CheckEmailResult {
  exists: boolean;
  isActive?: boolean;
  hasPassword?: boolean;
}

export interface IAuthService {
  /**
   * Authenticate user with email and password
   */
  login(email: string, password: string): Promise<LoginResult>;

  /**
   * Verify OTP token for client authentication
   */
  verifyOtp(email: string, token: string): Promise<VerifyOtpResult>;

  /**
   * Check if email exists in the system
   */
  checkEmail(email: string): Promise<CheckEmailResult>;

  /**
   * Change user password
   */
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void>;

  /**
   * Request password reset via email
   */
  forgotPassword(email: string): Promise<void>;

  /**
   * Reset password using OTP token
   */
  resetPassword(
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void>;

  /**
   * Set initial password for user
   */
  setPassword(
    userId: string,
    password: string,
    confirmPassword: string,
  ): Promise<void>;
}
