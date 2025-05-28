export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
