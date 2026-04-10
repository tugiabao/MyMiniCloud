import  { useState, useEffect } from 'react';
import { useSchedules } from '../../controllers/useSchedules';
import { Clock, Plus, Trash2, Loader2, Calendar, Settings2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const AutomationConfig = ({ systemName }: { systemName: string }) => {
  const { schedules, addSchedule, removeSchedule, loadSchedules, toggleSchedule } = useSchedules();
  const { t } = useLanguage();
  
  // State quản lý form
  const [isAdding, setIsAdding] = useState(false);
  const [newTime, setNewTime] = useState("08:00");
  const [duration, setDuration] = useState(10);
  const [selectedDevice, setSelectedDevice] = useState<string>('relay1');
  const [deviceValue, setDeviceValue] = useState(1); // Mặc định là 1 (Bật)

  // Danh sách các loại thiết bị hỗ trợ lập lịch (Sử dụng t() để dịch label)
  const DEVICE_OPTIONS = [
    { value: 'relay1', label: t('relay_1') },
    { value: 'relay2', label: t('relay_2') },
    { value: 'relay3', label: t('relay_3') },
    { value: 'light', label: 'Đèn LED' }, // Cần bổ sung vào từ điển sau nếu chưa có
    { value: 'servo', label: t('feeder') },
    { value: 'camera', label: t('camera') },
  ];

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleAdd = async () => {
    setIsAdding(true);
    
    // Tạo request object cơ bản
    const requestData: any = {
      systemName,
      device: selectedDevice,
      startTime: newTime,
    };

    // Chỉ gửi duration nếu không phải là máy cho ăn
    if (selectedDevice !== 'servo') {
      requestData.duration = duration;
    }

    // Chỉ gửi value nếu là đèn (chỉnh độ sáng)
    if (selectedDevice === 'light') {
      requestData.value = deviceValue;
    }

    await addSchedule(requestData);
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      {/* Form Cấu hình mới */}
      <div className="bg-indigo-50/50 dark:bg-slate-800/50 p-4 rounded-3xl border border-indigo-100 dark:border-slate-700 space-y-4 transition-colors backdrop-blur-md">
        <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-2 tracking-widest">
          <Settings2 size={14}/> {t('add_schedule')}
        </h4>

        <div className="space-y-3">
          {/* Lựa chọn thiết bị */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">{t('select_device')}</label>
            <select 
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full p-3 rounded-2xl border-none font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white/80 dark:bg-slate-700 dark:text-white transition-colors"
            >
              {DEVICE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {selectedDevice === 'light' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">{t('light_intensity')} (0-255)</label>
              <input 
                type="number" 
                min="0" max="255"
                value={deviceValue} 
                onChange={e => setDeviceValue(Number(e.target.value))} 
                className="w-full p-3 rounded-2xl border-none font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white/80 dark:bg-slate-700 dark:text-white text-center transition-colors" 
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Giờ bắt đầu */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">{t('start_time')}</label>
              <input 
                type="time" 
                value={newTime} 
                onChange={e => setNewTime(e.target.value)} 
                className="w-full p-3 rounded-2xl border-none font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white/80 dark:bg-slate-700 dark:text-white transition-colors" 
              />
            </div>
            {/* Thời lượng */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">{t('duration')} ({t('minutes')})</label>
              <input 
                type="number" 
                value={duration} 
                onChange={e => setDuration(Number(e.target.value))} 
                className="w-full p-3 rounded-2xl border-none font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white/80 dark:bg-slate-700 dark:text-white text-center transition-colors" 
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleAdd} 
          disabled={isAdding}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
        >
          {isAdding ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>} 
          {t('save_schedule')}
        </button>
      </div>

      {/* Danh sách lịch trình hiện tại */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {schedules
          .filter(s => s.systemName === systemName)
          .map((s, index) => (
          <div key={`${s.systemName}-${index}`} className="p-4 bg-white/60 dark:bg-slate-800 rounded-2xl flex justify-between items-center border border-slate-50 dark:border-slate-700 shadow-sm hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all group backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-50 text-slate-300 dark:bg-slate-700 dark:text-slate-500'}`}>
                <Clock size={18}/>
              </div>
              <div>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">{s.startTime}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                  {DEVICE_OPTIONS.find(opt => opt.value === s.device)?.label || s.device} • {s.duration} {t('minutes')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => toggleSchedule(s.id, { 
                    isActive: !s.isActive, 
                    systemName: s.systemName 
                })}
                className={`text-[10px] font-black px-3 py-1.5 rounded-xl transition-all ${
                    s.isActive ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                }`}
              >
                {s.isActive ? t('active').toUpperCase() : t('inactive').toUpperCase()}
              </button>
              
              <button 
                onClick={() => removeSchedule(s.id)} 
                className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 dark:text-slate-600 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-all"
              >
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        ))}
        {schedules.filter(s => s.systemName === systemName).length === 0 && (
          <div className="text-center py-10 opacity-40 dark:opacity-30">
            <Calendar size={32} className="mx-auto mb-2 text-slate-400 dark:text-slate-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Chưa có lịch trình nào</p>
          </div>
        )}
      </div>
    </div>
  );
};