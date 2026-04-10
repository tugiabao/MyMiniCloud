import React, { useState } from 'react';
import { useSensors } from '../../controllers/useSensors'; // 👈 Chuyển sang dùng Socket Hook
import { Power, Activity, Fan, Fish, Camera, Sun } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { DeviceType } from '../../types';

import { NotificationPopup, type NotificationType } from '../common/NotificationPopup';

interface ControlBtnProps {
    icon: React.ReactNode;
    label: string;
    onClick: (status: boolean) => void;
    isLoading: boolean;
    isOn?: boolean; // Thêm prop để đồng bộ trạng thái từ Server
}

export const DeviceControls = ({ systemName }: { systemName: string }) => {
    const { sendCommand, sensorData } = useSensors(systemName); // 👈 Lấy hàm gửi lệnh
    const [lightValue, setLightValue] = useState(0);
    const { t } = useLanguage();
    const [notification, setNotification] = useState<{ message: string, type: NotificationType } | null>(null);

    // Lấy trạng thái thực tế từ Room dữ liệu trả về để cập nhật nút bấm
    const status = sensorData?.status;

    // Đồng bộ giá trị đèn từ Server/Optimistic Update về Slider
    React.useEffect(() => {
        if (status?.light !== undefined) {
            setLightValue(status.light);
        }
    }, [status?.light]);

    /**
     * Xử lý gửi lệnh qua Socket
     */
    const handleControl = async (
        type: DeviceType,
        statusValue?: boolean | number,
        index?: number
    ) => {
        let finalValue: any = statusValue;

        // Chuẩn hóa giá trị theo format mà Backend DeviceService đang dùng
        if (type === 'LIGHT') {
            finalValue = Number(statusValue);
        } else if (type === 'RELAY' || type === 'CAMERA') {
            finalValue = statusValue ? true : false;
        }

        try {
            await sendCommand(type, finalValue, index);

            // Chỉ hiện thông báo cho Cho cá ăn và Đo pH
            if (type === 'FEEDER') {
                setNotification({ message: t('feeding') || 'Đang cho ăn...', type: 'success' });
            } else if (type === 'PH_METER') {
                setNotification({ message: t('measuring') || 'Đang đo...', type: 'success' });
            }
        } catch (error) {
            setNotification({ message: t('action_failed'), type: 'error' });
        }
    };

    return (
        <div className="space-y-3">
            {notification && (
                <NotificationPopup
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
            <ControlBtn
                icon={<Power />} label={t('relay_1')}
                onClick={(s: boolean) => handleControl('RELAY', s, 1)}
                isLoading={false}
                isOn={status?.relays.r1}
            />
            <ControlBtn
                icon={<Activity />} label={t('relay_2')}
                onClick={(s: boolean) => handleControl('RELAY', s, 2)}
                isLoading={false}
                isOn={status?.relays.r2}
            />
            <ControlBtn
                icon={<Fan />} label={t('relay_3')}
                onClick={(s: boolean) => handleControl('RELAY', s, 3)}
                isLoading={false}
                isOn={status?.relays.r3}
            />
            <ControlBtn
                icon={<Camera />} label={t('camera')}
                onClick={(s: boolean) => handleControl('CAMERA', s)}
                isLoading={false}
                isOn={status?.camera as any}
            />

            <div className="bg-white/60 dark:bg-slate-800 border border-blue-50 dark:border-slate-700 p-4 rounded-2xl transition-colors backdrop-blur-md">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 shadow-sm">
                        <Sun size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('light_intensity')} ({lightValue})</span>
                </div>
                <input
                    type="range"
                    min="0" max="255"
                    value={lightValue}
                    onChange={(e) => setLightValue(Number(e.target.value))}
                    onMouseUp={() => handleControl('LIGHT', lightValue)}
                    onTouchEnd={() => handleControl('LIGHT', lightValue)}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                    onClick={() => handleControl('FEEDER')}
                    className="bg-orange-500 hover:bg-orange-600 text-white py-5 px-4 rounded-2xl font-bold text-sm flex flex-col items-center gap-2 transition-all shadow-md shadow-orange-200 dark:shadow-none active:scale-95 touch-manipulation"
                >
                    <Fish size={24} /> {t('feed_now')}
                </button>

                <button
                    onClick={() => handleControl('PH_METER')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white py-5 px-4 rounded-2xl font-bold text-sm flex flex-col items-center gap-2 transition-all shadow-md shadow-emerald-200 dark:shadow-none active:scale-95 touch-manipulation"
                >
                    <Activity size={24} /> {t('measure_ph')}
                </button>
            </div>
        </div>
    );
};

const ControlBtn = ({ icon, label, onClick, isOn }: ControlBtnProps) => {
    return (
        <div className={`flex justify-between items-center p-4 rounded-2xl border transition-all backdrop-blur-md ${isOn ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' : 'bg-white/60 dark:bg-slate-800 border-blue-50 dark:border-slate-700'}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isOn ? 'bg-blue-500 text-white shadow-md' : 'bg-blue-50 dark:bg-slate-700 text-blue-400 dark:text-slate-500'}`}>
                    {icon}
                </div>
                <span className={`text-sm font-bold transition-colors ${isOn ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{label}</span>
            </div>
            <button
                onClick={() => onClick(!isOn)}
                className={`w-12 h-6 rounded-full relative transition-colors ${isOn ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-600'}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isOn ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
};