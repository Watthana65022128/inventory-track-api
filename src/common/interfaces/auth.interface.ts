import { UserRole } from '../enums/role.enum';

/**
 * JWT Payload structure
 * Used in JWT token generation and validation
 */
export interface JwtPayload {
  sub: string; // User ID
  username: string;
  email: string;
  role: UserRole;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

/**
 * Authentication tokens response
 * Returned after successful login
 */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number; // Access token expiration in seconds
}

/**
 * Complete login response
 * Includes both tokens and user information
 */
export interface LoginResponse extends AuthTokens {
  user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    first_name?: string;
    last_name?: string;
    phone?: string;
    is_active: boolean;
  };
}

/**
 * User info extracted from JWT token
 * Available via @CurrentUser() decorator
 */
export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}
