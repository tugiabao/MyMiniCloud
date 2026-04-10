import { useState } from 'react';
import { streamService } from '../services/streamService';
import type { StreamResponse } from '../types';

export const useStream = () => {
  const [streamUrls, setStreamUrls] = useState<StreamResponse | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStreaming = async (systemName: string) => {
    try {
      const data = await streamService.startStream(systemName);
      setStreamUrls(data);
      setIsStreaming(true);
    } catch (error) {
      console.error("Không thể mở camera:", error);
    }
  };

  const stopStreaming = async () => {
    try {
      await streamService.stopStream();
      setStreamUrls(null);
      setIsStreaming(false);
    } catch (error) {
      console.error("Lỗi khi tắt camera:", error);
    }
  };

  return { streamUrls, isStreaming, startStreaming, stopStreaming };
};