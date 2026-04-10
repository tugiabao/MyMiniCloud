export interface RegisterDto {
  email: string;
  password?: string;
  fullName: string;
  gender?: string;
  birthday?: string;
  phone?: string;
  address?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  address?: string;
  gender?: string;
  birthday?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: UserResponse;
}

export interface GoogleUrlResponse {
  url: string;
}

export interface SimpleMessageResponse {
  message: string;
}

export interface LoginDto {
  email: string;
  password?: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  phone?: string;
  address?: string;
  gender?: string;
  birthday?: string;
}
