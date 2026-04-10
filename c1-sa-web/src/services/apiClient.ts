import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
// Import interface AuthResponse đã định nghĩa ở dto để đồng bộ
import type { AuthResponse } from '../types/auth.dto'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * REQUEST INTERCEPTOR: Gắn Token vào Header
 */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const oidcStorageKey = 'oidc.user:https://auth.azura.io.vn/realms/smart_aquarium:aquarium-frontend';
  const oidcUserStr = localStorage.getItem(oidcStorageKey);
  
  if (oidcUserStr) {
    try {
      const oidcUser = JSON.parse(oidcUserStr);
      if (oidcUser && oidcUser.access_token && config.headers) {
        config.headers.Authorization = `Bearer ${oidcUser.access_token}`;
      }
    } catch (error) {
      console.error("Lỗi parse OIDC Token:", error);
    }
  }
  return config;
});

/**
 * RESPONSE INTERCEPTOR: Xử lý lỗi tập trung
 */
apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    // Tự động đăng xuất nếu Token hết hạn hoặc không hợp lệ (401)
    if (err.response?.status === 401) {
      localStorage.removeItem('user');
      // Tránh lặp lại chuyển hướng nếu đang ở trang login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(err);
  }
);