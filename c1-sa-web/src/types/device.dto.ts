/**
 * Danh sách các loại thiết bị được hỗ trợ
 */
export type DeviceType = 'RELAY' | 'CAMERA' | 'FEEDER' | 'PH_METER' | 'LIGHT' | 'GET_INFO';

/**
 * Thông tin hệ thống hồ cá từ Backend
 */
export interface AquariumSystem {
  id: string;
  name: string;      // Mã định danh (VD: 'SA01')
  is_active: boolean;
  created_at: string;
  userId: string;
}

/**
 * Interface cho yêu cầu đăng ký hệ thống mới
 */
export interface RegisterSystemRequest {
  systemName: string;
  userId: string;
}

/**
 * Interface cho phản hồi đăng ký hệ thống
 */
export interface RegisterSystemResponse {
  message: string;
  system: AquariumSystem;
}

/**
 * Wrapper cho phản hồi danh sách hệ thống
 */
export interface SystemsResponseWrapper {
  message: string;
  systems: AquariumSystem[];
  total: number;
}

/**
 * Cấu trúc điều khiển thiết bị
 */
export interface DeviceControlRequest {
  systemName: string;
  device: DeviceType;
  value?: number | boolean; 
  index?: number;
}

export interface DeviceControlResponse {
  message: string;
  target: string;
  command: Record<string, unknown>;
}

/**
 * Dữ liệu hiển thị trên UI Card
 */
export interface SystemData {
  name: string;      
  temp: number;
  isWaterLow: boolean;
  isActive: boolean;
}

export interface ModalState {
  isOpen: boolean;
  systemName: string;
}