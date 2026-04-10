// Input từ MQTT
export interface MqttSensorData {
  temp: number;
  ph: number;
  liquid: number;
  relay1: boolean;
  relay2: boolean;
  relay3: boolean;
  light: number;
  camera: boolean;
  last_feed: string; // "15/01/2026 09:51:10"
  last_ph_time: string; // "15/01/2026 09:42:51"
  ts: number; // Timestamp hoặc Uptime
}

// Output WebSocket - Status
export interface SystemStatus {
  temp: number;
  ph: number;
  liquid: number;
  relays: {
    r1: boolean;
    r2: boolean;
    r3: boolean;
  };
  light: number;
  camera: boolean; // Trạng thái bật/tắt camera
  isOnline: boolean;
}

// Output WebSocket - Reminder Detail
export interface ReminderDetail {
  isLate: boolean;
  lastTime: string;
  message: string;
}

// Output WebSocket - Alerts
export interface SystemAlerts {
  tempAlert: string | null;
  phAlert: string | null;
  feedingReminder: ReminderDetail;
  phReminder: ReminderDetail;
}

// Output WebSocket - Full Payload
export interface WebSocketSensorPayload {
  systemName: string;
  status: SystemStatus;
  alerts: SystemAlerts;
  timestamp: string; // ISO String
}
