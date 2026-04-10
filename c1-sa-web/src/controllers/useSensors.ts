import { useSensorContext } from '../context/SensorContext';

export const useSensors = (systemName?: string) => {
  const { latestData, historyData, thresholds, isConnected, sendCommand } = useSensorContext();

  return {
    sensorData: systemName ? latestData[systemName] : null,
    history: (systemName ? historyData[systemName] : []) || [],
    thresholds: systemName ? thresholds[systemName] : undefined, // 👈 Trả về ngưỡng của hệ thống
    isConnected,
    // Hàm sendCommand bọc sẵn systemName để tiện dùng
    sendCommand: (device: string, value?: any, index?: number) => {
      if (systemName) return sendCommand(systemName, device, value, index);
      return Promise.reject("No system name provided");
    }
  };
};