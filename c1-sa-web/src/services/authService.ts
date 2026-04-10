// authService.ts
import { apiClient } from './apiClient';
import type { UpdateProfileRequest, User } from '../types';

export const authService = {
  updateProfile: async (data: UpdateProfileRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/update', data);
    return response.data;
  },

  getCurrentUser: (): User | null => {
    try {
      const oidcStorageKey = 'oidc.user:https://auth.azura.io.vn/realms/smart_aquarium:aquarium-frontend';
      const raw = localStorage.getItem(oidcStorageKey);
      if (raw) {
        const oidcContext = JSON.parse(raw);
        // Map thông tin từ OIDC Token sang định dạng User của frontend
        return {
          id: oidcContext.profile.sub,
          email: oidcContext.profile.email,
          fullName: oidcContext.profile.name || oidcContext.profile.preferred_username,
        } as User;
      }
      return null;
    } catch {
      return null;
    }
  }
};