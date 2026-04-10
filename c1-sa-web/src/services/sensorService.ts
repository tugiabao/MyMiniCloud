import { io, Socket } from 'socket.io-client';
import { apiClient } from './apiClient';
import type { SensorLog } from '../types/sensor';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000');

class SensorService {
  private socket: Socket | null = null;

  // --- API REST ---
  async getLatestStatus(systemName: string) {
    const response = await apiClient.post<{ source: string; data: SensorLog | null }>('/sensor/status', { systemName });
    return response.data.data;
  }

  async getHistory(systemName: string, limit = 20) {
    const response = await apiClient.get<SensorLog[]>('/sensor/history', { 
        params: { systemName, limit } 
    });
    return response.data;
  }

  // --- WEBSOCKET ---
  getSocket(): Socket {
    if (!this.socket) {
      const host = SOCKET_URL; 
      
      // 2. Kết nối tới Namespace cụ thể
      // Manager sẽ kết nối tới host, sau đó socket sẽ handshake vào namespace /system
      this.socket = io(`${host}/system`, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        autoConnect: true,
        reconnectionAttempts: 5,
      });
      
      this.socket.on('connect', () => {
        console.log('✅ Connected to System Socket:', this.socket?.id);
      });

      this.socket.on('connect_error', (err) => {
        console.error('❌ Socket Error:', err.message);
      });
    }
    return this.socket;
  }

  // Hàm mới để gửi lệnh qua socket
  emitCommand(payload: any) {
    const socket = this.getSocket();
    socket.emit('dispatch_command', payload);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const sensorService = new SensorService();