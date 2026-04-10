import { apiClient } from './apiClient';
import type { 
  DeviceControlRequest, 
  DeviceControlResponse, 
  SystemsResponseWrapper,
  RegisterSystemRequest,
  RegisterSystemResponse
} from '../types/device.dto';
import type { CreateScheduleRequest, ToggleScheduleRequest, DeviceConfig } from '../types/schedule.dto';

export const deviceService = {
  // Lấy danh sách hệ thống của tôi
  getMySystems: () => 
    apiClient.get<SystemsResponseWrapper>('/device/my-systems').then(r => r.data),
  
  // Điều khiển thiết bị
  controlDevice: (payload: DeviceControlRequest) => 
    apiClient.post<DeviceControlResponse>('/device/control', payload).then(r => r.data),

  // 🆕 Đăng ký hệ thống mới
  registerSystem: (payload: RegisterSystemRequest) =>
    apiClient.post<RegisterSystemResponse>('/device/register', payload).then(r => r.data),

  // 🆕 Hủy đăng ký hệ thống
  unregisterSystem: (systemName: string) =>
    apiClient.delete(`/device/${systemName}`).then(r => r.data),

  // --- API Lịch trình (Schedules) ---
  
  getSchedules: () => apiClient.get<DeviceConfig[]>('/schedule').then(r => r.data),
  
  createSchedule: (data: CreateScheduleRequest) => 
    apiClient.post<DeviceConfig>('/schedule', data).then(r => r.data),

  toggleSchedule: (id: string | number, payload: ToggleScheduleRequest) =>
    apiClient.patch(`/schedule/${id}/toggle`, payload).then(r => r.data),
  
  deleteSchedule: (id: string | number) => 
    apiClient.delete(`/schedule/${id}`)
};