// types/auth.dto.ts

export interface User {
  id?: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  gender?: string;
  birthday?: string;
  avatarUrl?: string;
}

export interface RegisterRequest extends User {
  password: string; // 
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string;
  gender?: string;
  birthday?: string;
}

export interface LoginRequest {
  email: string;
  password: string; // 
}

export interface AuthResponse {
  message?: string;
  accessToken: string; // 
  user: User; // 
}

export interface GoogleAuthResponse {
  url: string; // [cite: 6]
}