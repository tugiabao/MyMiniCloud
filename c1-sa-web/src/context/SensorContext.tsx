import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { sensorService } from '../services/sensorService';
import { deviceService } from '../services/deviceService';
import { useAuth } from '../controllers/useAuth';
import type { WebSocketSensorPayload, SystemStatus } from '../types/sensor';

interface SensorThresholds {
  temp?: { min?: number; max?: number };
  ph?: { min?: number; max?: number };
}

interface SensorContextType {
  // Dữ liệu mới nhất của từng hệ thống (cho Dashboard/Card)
  latestData: Record<string, WebSocketSensorPayload>;
  // Lịch sử dữ liệu của từng hệ thống (cho Biểu đồ, tối đa 50 điểm)
  historyData: Record<string, WebSocketSensorPayload[]>;
  // Ngưỡng cảnh báo của từng hệ thống
  thresholds: Record<string, SensorThresholds>;
  isConnected: boolean;
  sendCommand: (systemName: string, device: string, value?: any, index?: number) => void;
  refreshAll: () => void;
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

export const SensorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [latestData, setLatestData] = useState<Record<string, WebSocketSensorPayload>>({});
  const [historyData, setHistoryData] = useState<Record<string, WebSocketSensorPayload[]>>({});
  const [thresholds, setThresholds] = useState<Record<string, SensorThresholds>>({});
  const [isConnected, setIsConnected] = useState(false);
  
  // Dùng ref để giữ danh sách system hiện tại, tránh dependency loop
  const systemsRef = useRef<string[]>([]);
  // Dùng Set để chặn việc emit join_room liên tục giống nhau
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  /**
   * 1. Khởi tạo Socket & Lắng nghe sự kiện
   */
  useEffect(() => {
    if (!user) return; // Chỉ chạy khi đã đăng nhập

    const socket = sensorService.getSocket();

    const onConnect = () => {
        setIsConnected(true);
        // Re-join rooms khi reconnect, phải clear set để nó emit lại
        joinedRoomsRef.current.clear();
        systemsRef.current.forEach(sys => {
            if (!joinedRoomsRef.current.has(sys)) {
                joinedRoomsRef.current.add(sys);
                socket.emit('join_room', sys);
            }
        });
    };

    const onDisconnect = () => setIsConnected(false);

    const onSensorUpdate = (payload: WebSocketSensorPayload) => {
        const sysName = payload.systemName;
        
        // Cập nhật Latest Data
        setLatestData(prev => ({ ...prev, [sysName]: payload }));

        // Cập nhật History Data (Giữ 50 điểm mới nhất)
        setHistoryData(prev => {
            const currentHistory = prev[sysName] || [];
            const newHistory = [...currentHistory, payload].slice(-50); // Cắt lấy 50 phần tử cuối
            return { ...prev, [sysName]: newHistory };
        });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('sensor_update', onSensorUpdate);

    // Kiểm tra trạng thái ngay lập tức (nếu socket đã connect từ trước)
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('sensor_update', onSensorUpdate);
    };
  }, [user?.id]); // 👈 Đổi thành user?.id để không bị Render Loop do thẻ OIDC refresh token

  /**
   * 2. Hàm Eager Fetch: Lấy danh sách hệ thống -> Join Room -> Lấy Snapshot & Config
   */
  const initSystems = useCallback(async () => {
    if (!user?.id) return;

    try {
        // A. Lấy danh sách hệ thống của user
        const res = await deviceService.getMySystems();
        const systems = res.systems.map(s => s.name);
        systemsRef.current = systems; // Lưu ref để dùng khi reconnect

        // B. Lấy cấu hình ngưỡng (Schedules/Configs)
        try {
            const configs = await deviceService.getSchedules();
            const newThresholds: Record<string, SensorThresholds> = {};
            
            // Map config vào struct thresholds
            configs.forEach(cfg => {
                if (!newThresholds[cfg.systemName]) newThresholds[cfg.systemName] = {};
                
                if (cfg.device === 'TEMP_THRESHOLD' && cfg.isActive) {
                    newThresholds[cfg.systemName].temp = { min: cfg.min, max: cfg.max };
                }
                if (cfg.device === 'PH_THRESHOLD' && cfg.isActive) {
                    newThresholds[cfg.systemName].ph = { min: cfg.min, max: cfg.max };
                }
            });
            setThresholds(newThresholds);
        } catch (err) {
            console.error("Lỗi tải cấu hình ngưỡng:", err);
        }

        const socket = sensorService.getSocket();

        // C. Join Room & Lấy Snapshot cho TỪNG hệ thống
        for (const sysName of systems) {
            // Join Socket Room
            if (socket.connected && !joinedRoomsRef.current.has(sysName)) {
                joinedRoomsRef.current.add(sysName);
                socket.emit('join_room', sysName);
            }

            // Fetch Snapshot (REST API)
            try {
                const snapshot = await sensorService.getLatestStatus(sysName);
                if (snapshot) {
                    const mappedPayload: WebSocketSensorPayload = {
                        systemName: sysName,
                        timestamp: snapshot.createdAt,
                        status: {
                            temp: snapshot.temperature,
                            ph: snapshot.ph,
                            liquid: snapshot.liquid,
                            relays: { r1: false, r2: false, r3: false }, 
                            light: 0,
                            isOnline: false,
                            camera: false
                        } as SystemStatus,
                        alerts: {
                            tempAlert: null, phAlert: null,
                            feedingReminder: { isLate: false, message: '', lastTime: '' },
                            phReminder: { isLate: false, message: '', lastTime: '' }
                        }
                    };
                    
                    setLatestData(prev => ({
                        ...prev,
                        [sysName]: prev[sysName] || mappedPayload
                    }));
                }
            } catch (err) {
                console.warn(`Không thể lấy snapshot cho ${sysName}`, err);
            }
        }
    } catch (error) {
        console.error("Lỗi khởi tạo hệ thống cảm biến:", error);
    }
  }, [user?.id]); // 👈 Chỉ theo dõi chuỗi ID thay vì object để tránh vòng lặp bộ nhớ

  // Tự động chạy init khi user thay đổi (đăng nhập)
  useEffect(() => {
    if (user?.id) initSystems();
  }, [user?.id, initSystems]);

  /**
   * 3. Client-side Monitoring: Giám sát liên tục
   * So sánh dữ liệu mới nhất với ngưỡng cài đặt trong RAM
   */
  useEffect(() => {
    Object.keys(latestData).forEach(sysName => {
        const data = latestData[sysName];
        const config = thresholds[sysName];
        if (!data || !config) return;

        // Check Temp
        if (config.temp) {
            const { min, max } = config.temp;
            const val = data.status.temp;
            if (min !== undefined && val < min) console.warn(`[${sysName}] ⚠️ Nhiệt độ thấp: ${val}°C < ${min}°C`);
            if (max !== undefined && val > max) console.warn(`[${sysName}] ⚠️ Nhiệt độ cao: ${val}°C > ${max}°C`);
        }

        // Check pH
        if (config.ph) {
            const { min, max } = config.ph;
            const val = data.status.ph;
            if (min !== undefined && val < min) console.warn(`[${sysName}] ⚠️ pH thấp: ${val} < ${min}`);
            if (max !== undefined && val > max) console.warn(`[${sysName}] ⚠️ pH cao: ${val} > ${max}`);
        }
    });
  }, [latestData, thresholds]);

  /**
   * 4. Gửi lệnh điều khiển (Có Optimistic Update)
   */
  const sendCommand = useCallback((systemName: string, device: string, value?: any, index?: number) => {
    // Gửi qua Socket
    sensorService.emitCommand({ systemName, device, value, index });

    // Optimistic Update vào Latest Data
    setLatestData(prev => {
        const currentData = prev[systemName];
        if (!currentData) return prev;

        const nextStatus = { ...currentData.status };
        
        if (device === 'RELAY' && index) {
            const relayKey = `r${index}` as keyof typeof nextStatus.relays;
            if (nextStatus.relays) nextStatus.relays = { ...nextStatus.relays, [relayKey]: !!value };
        } else if (device === 'LIGHT') {
            nextStatus.light = Number(value);
        } else if (device === 'CAMERA') {
            nextStatus.camera = !!value;
        }

        return {
            ...prev,
            [systemName]: { ...currentData, status: nextStatus }
        };
    });
  }, []);

  return (
    <SensorContext.Provider value={{ 
        latestData, 
        historyData,
        thresholds,
        isConnected, 
        sendCommand,
        refreshAll: initSystems 
    }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensorContext = () => {
  const context = useContext(SensorContext);
  if (!context) throw new Error('useSensorContext must be used within SensorProvider');
  return context;
};
