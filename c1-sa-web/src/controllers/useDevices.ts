import { useState, useCallback } from 'react';
import { deviceService } from '../services/deviceService';
import { authService } from '../services/authService';
import type {
  AquariumSystem,
  DeviceControlRequest,
  RegisterSystemResponse
} from '../types/device.dto';

export const useDevices = () => {
  const [systems, setSystems] = useState<AquariumSystem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSystems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await deviceService.getMySystems();
      setSystems(response.systems || []);
    } catch (error) {
      console.error("Lỗi tải danh sách hệ thống:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const registerNewSystem = async (systemName: string): Promise<RegisterSystemResponse> => {
    setLoading(true);
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Cần đăng nhập để đăng ký hệ thống');

      const response = await deviceService.registerSystem({
        systemName,
        userId: user.id ?? ''
      });

      await fetchSystems();
      return response;
    } finally {
      setLoading(false);
    }
  };

  const unregisterSystem = async (systemName: string): Promise<boolean> => {
    if (!window.confirm(`Bạn có chắc muốn xóa hệ thống ${systemName}?`)) return false;

    setLoading(true);
    try {
      await deviceService.unregisterSystem(systemName);
      await fetchSystems();
      return true;
    } catch (error) {
      console.error('Lỗi khi xóa hệ thống:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const controlDevice = useCallback(async (payload: DeviceControlRequest) => {
    try {
      return await deviceService.controlDevice(payload);
    } catch (error) {
      console.error("Lỗi lệnh điều khiển:", error);
      throw error;
    }
  }, []);

  return { systems, loading, fetchSystems, controlDevice, registerNewSystem, unregisterSystem };
};