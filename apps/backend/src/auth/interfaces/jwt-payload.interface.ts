/**
 * JWT Token Payload Interface
 * Defines the structure of decoded JWT tokens throughout the application
 */
export interface JwtPayload {
  /**
   * User ID
   */
  userId: string;

  /**
   * User email
   */
  email: string;

  /**
   * User role (ADMIN or CLIENT)
   */
  role: string;

  /**
   * Token expiration timestamp (Unix timestamp in seconds)
   */
  exp?: number;

  /**
   * Token issued at timestamp (Unix timestamp in seconds)
   */
  iat?: number;

  /**
   * Token issuer
   */
  iss?: string;

  /**
   * Token audience
   */
  aud?: string;
}
