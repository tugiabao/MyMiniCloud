import { apiClient } from './apiClient';
import type { StreamResponse} from '../types';

export const streamService = {
  /**
   * Bắt đầu luồng livestream (Live & AI)
   */
  startStream: async (systemName: string): Promise<StreamResponse> => {
    const response = await apiClient.post<StreamResponse>('/stream/start', { systemName });
    return response.data;
  },

  /**
   * Ngắt luồng livestream
   */
  stopStream: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/stream/stop');
    return response.data;
  },

  /**
   * Chuyển đổi chế độ AI (OFF | FISH | HAND)
   */
  setAiMode: async (mode: 'off' | 'fish' | 'hand'): Promise<void> => {
    await apiClient.post('/stream/mode', { mode });
  }
};