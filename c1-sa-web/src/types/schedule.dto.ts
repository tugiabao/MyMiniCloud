// types/schedule.dto.ts

export interface DeviceConfig {
  id: string;
  systemName: string;
  device: string;
  startTime: string;
  duration?: number;
  value?: any;
  isActive: boolean;
  min?: number;
  max?: number;
  alertDelay?: number; // 👈 Thêm
}

export interface CreateScheduleRequest {
  systemName: string; 
  device: string;     
  startTime?: string; // Không bắt buộc với Threshold
  duration?: number;  
  value?: any;        
  min?: number;
  max?: number;
  alertDelay?: number; // 👈 Thêm
  isActive?: boolean; 
}

export interface ToggleScheduleRequest {
  isActive: boolean;  
  systemName: string; 
}