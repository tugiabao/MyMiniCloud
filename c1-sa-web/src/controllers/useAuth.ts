import { useAuth as useOidcAuth } from 'react-oidc-context';
import { authService } from '../services/authService';
import type { RegisterRequest, UpdateProfileRequest, User } from '../types';

export const useAuth = () => {
  const auth = useOidcAuth();

  const user: User | null = auth.isAuthenticated && auth.user ? {
      id: auth.user.profile.sub || '',
      email: auth.user.profile.email || auth.user.profile.preferred_username || '',
      fullName: auth.user.profile.given_name || auth.user.profile.name || '',
      phone: '',
      address: '',
      gender: '',
      birthday: ''
  } : null;

  const login = async () => {
    return auth.signinRedirect();
  };

  const register = async (data: RegisterRequest) => {
    // Không còn chức năng đăng ký cục bộ nữa
    throw new Error("Vui lòng đăng ký qua cổng thông tin nội bộ MyMiniCloud");
  };

  const updateProfile = async (data: UpdateProfileRequest) => {
    return await authService.updateProfile(data);
  };

  const logout = async () => {
    await auth.signoutRedirect();
    localStorage.removeItem('user'); // Xóa cache cũ nếu còn
  };

  return { user, login, register, updateProfile, logout, loading: auth.isLoading, handleGoogleLogin: login, loginWithGoogle: login };
};