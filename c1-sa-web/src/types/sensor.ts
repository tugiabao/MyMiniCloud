// Đồng bộ với Backend: backend-main/src/sensor/sensor.dto.ts

export interface SystemStatus {
  temp: number;
  ph: number;
  liquid: number; // 1: ĐỦ, 0: THIẾU
  relays: {
    r1: boolean;
    r2: boolean;
    r3: boolean;
  };
  light: number;
  camera: boolean;
  isOnline: boolean;
}

export interface ReminderDetail {
  isLate: boolean;
  lastTime: string;
  message: string;
}

export interface SystemAlerts {
  tempAlert: string | null;
  phAlert: string | null;
  feedingReminder: ReminderDetail;
  phReminder: ReminderDetail;
}

// Payload nhận được từ WebSocket 'sensor_update'
export interface WebSocketSensorPayload {
  systemName: string;
  status: SystemStatus;
  alerts: SystemAlerts;
  timestamp: string; // ISO String
}

// Interface cũ dùng cho API REST (History/Status Snapshot) - Giữ lại để tương thích ngược
export interface SensorLog {
  id: number;
  systemName: string;
  temperature: number;
  ph: number;
  liquid: number;
  lastFeedTime: string;
  lastPhTime: string;
  createdAt: string;
}
