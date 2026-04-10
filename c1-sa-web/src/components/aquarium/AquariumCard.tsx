import React from 'react';
import { Thermometer, Droplets, Trash2 } from 'lucide-react';
import { useSensors } from '../../controllers/useSensors';
import { useLanguage } from '../../context/LanguageContext';
import type { SystemData } from '../../types';

interface AquariumCardProps {
  data: SystemData;
  onClick: (systemName: string) => void; 
  onDelete?: (systemName: string) => void;
}

export const AquariumCard: React.FC<AquariumCardProps> = ({ data, onClick, onDelete }) => {
  const { sensorData, isConnected } = useSensors(data.name);
  const { t } = useLanguage();

  // Map dữ liệu từ WebSocket Payload
  const status = sensorData?.status;
  
  // Hiển thị: Nếu có socket data thì dùng, không thì dùng props (fallback)
  const currentTemp = status?.temp ?? data.temp ?? 0;
  const isWaterLow = status ? status.liquid === 0 : data.isWaterLow;
  
  // Trạng thái Online: Dựa vào flag từ Backend (chính xác hơn socket connected)
  const isOnline = status?.isOnline ?? false; 

  return (
    <div 
      onClick={() => onClick(data.name)} 
      className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400 transition-colors">
            {data.name}
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
            {t('system')}: {data.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Socket Status Indicator (Debug nhỏ) */}
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} absolute top-2 right-2`} title="Socket Connection"></div>

          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider border shadow-sm ${isOnline ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'}`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
            {isOnline ? t('online').toUpperCase() : t('offline').toUpperCase()}
          </span>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(data.name);
              }}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              title={t('delete')}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-2xl flex flex-col items-center border border-orange-100 dark:border-orange-900/50">
          <Thermometer size={20} className="text-orange-500 mb-2" />
          <span className="text-2xl font-black text-slate-800 dark:text-orange-100">{currentTemp.toFixed(1)}°C</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">{t('temp_water')}</span>
        </div>
        
        <div className={`p-4 rounded-2xl flex flex-col items-center border ${isWaterLow ? 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50' : 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50'}`}>
          <Droplets size={20} className={`${isWaterLow ? 'text-red-500' : 'text-blue-500'} mb-2`} />
          <span className={`text-2xl font-black ${isWaterLow ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {isWaterLow ? t('water_low') : t('water_good')} 
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">{t('water_level')}</span>
        </div>
      </div>
    </div>
  );
};