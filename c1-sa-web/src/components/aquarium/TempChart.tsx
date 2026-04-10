import React from 'react';
import { Thermometer } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSensors } from '../../controllers/useSensors';
import { getStatusColor } from '../../utils/statusUtils';

interface TempChartProps {
  systemName: string;
}

export const TempChart: React.FC<TempChartProps> = ({ systemName }) => {
  const { history, sensorData, thresholds } = useSensors(systemName);
  const { t } = useLanguage();

  // Lấy dữ liệu nhiệt độ từ history
  // Giả sử history là mảng WebSocketSensorPayload, lấy 20 điểm cuối
  const dataPoints = history.slice(-20).map(p => p.status.temp);
  const timestamps = history.slice(-20).map(p => {
      const date = new Date(p.timestamp);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  });

  // Nếu chưa có đủ dữ liệu lịch sử, lấy dữ liệu hiện tại làm điểm neo
  const currentTemp = sensorData?.status.temp || 0;
  
  // Xác định màu sắc dựa trên ngưỡng
  const { colorClass, status } = getStatusColor(currentTemp, thresholds?.temp, 2.0); // Buffer 2 độ
  const statusText = status === 'red' ? 'CRITICAL' : status === 'orange' ? 'WARNING' : t('stable');

  // Logic vẽ SVG đơn giản (Scale dữ liệu về 0-100)
  // Trục tung từ 0 - 50
  const normalize = (val: number) => {
      const min = 0, max = 50; 
      const percent = (val - min) / (max - min);
      return 100 - (Math.max(0, Math.min(1, percent)) * 100); // Đảo ngược Y
  };

  const points = dataPoints.map((val, i) => {
      const x = (i / (dataPoints.length - 1 || 1)) * 1000;
      const y = normalize(val);
      return `${x},${y}`;
  }).join(' L');

  // Path đầy đủ (Thêm điểm đầu/cuối để đóng vùng gradient)
  const areaPath = points ? `M0,100 L${points} L1000,100 Z` : '';
  const linePath = points ? `M${points}` : '';

  const yAxisLabels = [50, 40, 30, 20, 10, 0];

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 dark:border-slate-800 p-4 h-full flex flex-col transition-colors">
      {/* Header của biểu đồ */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs uppercase tracking-widest">
            <div className={`p-1.5 rounded-lg shadow-sm ${status === 'red' ? 'bg-red-100 text-red-600' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                <Thermometer size={14} />
            </div>
            {t('chart_temp')} ({systemName})
        </h3>
        <div className="flex flex-col items-end">
            <span className={`text-lg font-black leading-none ${colorClass}`}>{currentTemp.toFixed(1)}<span className="text-xs text-slate-400 dark:text-slate-500 ml-1">°C</span></span>
            <span className={`text-[9px] font-bold uppercase ${status === 'red' ? 'text-red-500' : status === 'orange' ? 'text-orange-500' : 'text-green-500'}`}>{statusText}</span>
        </div>
      </div>

      <div className="flex-1 flex gap-2">
          {/* Trục Y */}
          <div className="flex flex-col justify-between py-1 text-[8px] font-black text-slate-400 dark:text-slate-600 w-4">
              {yAxisLabels.map(label => <span key={label}>{label}</span>)}
          </div>

          <div className="flex-1 relative w-full flex flex-col">
              {/* Chart Area - Vùng vẽ biểu đồ */}
              <div className="flex-1 relative overflow-hidden rounded-xl bg-gradient-to-b from-orange-50/50 to-transparent dark:from-orange-900/20 border border-orange-100/30 dark:border-orange-900/30">
                    {/* Đường lưới (Grid Lines) */}
                    <div className="absolute inset-0 flex flex-col justify-between py-0 opacity-20">
                        {yAxisLabels.map(i => <div key={i} className="border-t border-slate-400 dark:border-slate-600 w-full h-0"></div>)}
                    </div>

                    {/* SVG Curve */}
                    {dataPoints.length > 1 ? (
                        <svg className="absolute inset-0 w-full h-full text-orange-500 stroke-current drop-shadow-md" preserveAspectRatio="none" viewBox="0 0 1000 100">
                            <defs>
                                <linearGradient id="gradTemp" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {/* Vùng đổ màu */}
                            <path d={areaPath} fill="url(#gradTemp)" strokeWidth="0" />
                            {/* Đường kẻ chính */}
                            <path d={linePath} fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-bold uppercase tracking-widest text-center px-4">
                            {t('loading')}...
                        </div>
                    )}
              </div>

              {/* Time Labels */}
              <div className="flex justify-between mt-3 px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                {timestamps.filter((_, i) => i % 4 === 0).map((time, index) => (
                    <span key={index}>{time}</span>
                ))}
              </div>
          </div>
      </div>
    </div>
  );
};