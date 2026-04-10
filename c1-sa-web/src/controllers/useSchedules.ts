import { useState, useCallback } from 'react';
import { deviceService } from '../services/deviceService';
import type { DeviceConfig, CreateScheduleRequest, ToggleScheduleRequest } from '../types/schedule.dto';

export const useSchedules = () => {
  const [schedules, setSchedules] = useState<DeviceConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await deviceService.getSchedules();
      setSchedules(data);
    } catch (error) {
      console.error("Lỗi tải lịch trình:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addSchedule = async (data: CreateScheduleRequest) => {
    try {
      // Làm sạch dữ liệu trước khi gửi: Chỉ giữ lại các trường có giá trị
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined && v !== '')
      );
      
      await deviceService.createSchedule(cleanData as CreateScheduleRequest);
      await loadSchedules();
    } catch (error) {
      console.error("Lỗi thêm lịch trình:", error);
    }
  };

  const saveThreshold = async (systemName: string, device: string, min: number, max: number, alertDelay: number = 0) => {
    try {
      await deviceService.createSchedule({
        systemName,
        device,
        min,
        max,
        alertDelay, // 👈 Truyền delay
        // Không cần gửi startTime hay isActive nữa, BE tự xử lý
      });
      await loadSchedules(); // Reload để cập nhật state
      return true;
    } catch (error) {
      console.error("Lỗi lưu ngưỡng an toàn:", error);
      return false;
    }
  };

  const toggleSchedule = async (id: string | number, payload: ToggleScheduleRequest) => {
    try {
      await deviceService.toggleSchedule(id, payload);
      setSchedules(prev => prev.map(s => 
        s.id == id ? { ...s, isActive: payload.isActive } : s
      ));
    } catch (error) {
      console.error("Lỗi thay đổi trạng thái:", error);
    }
  };

  const removeSchedule = async (id: string | number) => {
    try {
      await deviceService.deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s.id != id));
    } catch (error) {
      console.error("Lỗi xóa lịch trình:", error);
    }
  };

  return { schedules, loading, loadSchedules, addSchedule, toggleSchedule, removeSchedule, saveThreshold };
};