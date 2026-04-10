import { useState, useEffect } from 'react';
import { useSchedules } from '../../controllers/useSchedules';
import { ShieldCheck, Thermometer, Activity, Save, Loader2, CheckCircle, AlertCircle, MailWarning } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

type ThresholdType = 'TEMP' | 'PH';

export const SafeThresholds = ({ systemName }: { systemName: string }) => {
  const { schedules, loadSchedules, saveThreshold } = useSchedules();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Selection State
  const [selectedType, setSelectedType] = useState<ThresholdType>('TEMP');

  // Value State
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');
  const [alertDelay, setAlertDelay] = useState<string>('0');

  // Load data từ API khi component mount
  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Sync data khi đổi loại hoặc khi danh sách schedules thay đổi
  useEffect(() => {
    const deviceKey = selectedType === 'TEMP' ? 'TEMP_THRESHOLD' : 'PH_THRESHOLD';
    const config = schedules.find(s => s.systemName === systemName && s.device === deviceKey);

    if (config) {
      setMinValue(config.min?.toString() || '');
      setMaxValue(config.max?.toString() || '');
      setAlertDelay(config.alertDelay?.toString() || '0');
    } else {
      setMinValue('');
      setMaxValue('');
      setAlertDelay('0');
    }
  }, [schedules, systemName, selectedType]);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    const deviceKey = selectedType === 'TEMP' ? 'TEMP_THRESHOLD' : 'PH_THRESHOLD';
    
    if (minValue && maxValue) {
      const success = await saveThreshold(
        systemName, 
        deviceKey, 
        Number(minValue), 
        Number(maxValue),
        Number(alertDelay)
      );
      if (success) {
        setMessage({ type: 'success', text: t('update_success') });
      } else {
        setMessage({ type: 'error', text: t('action_failed') });
      }
      setTimeout(() => setMessage(null), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 dark:border-slate-800 p-4 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h3 className="text-xs font-black text-blue-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16}/> {t('safe_thresholds')}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium">{t('safe_thresholds_desc')}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. Lựa chọn loại (Nhiệt độ/pH) */}
        <div className="relative">
            <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ThresholdType)}
                className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all cursor-pointer"
            >
                <option value="TEMP">{t('temp_threshold')} (°C)</option>
                <option value="PH">{t('ph_threshold')} (pH)</option>
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                {selectedType === 'TEMP' ? <Thermometer size={16} className="text-orange-500"/> : <Activity size={16} className="text-green-500"/>}
            </div>
        </div>

        {/* 2. Cài đặt Ngưỡng giá trị */}
        <div className={`p-3 rounded-xl border transition-colors ${
            selectedType === 'TEMP' 
            ? 'bg-orange-50/30 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30' 
            : 'bg-green-50/30 dark:bg-green-900/10 border-green-100 dark:border-green-900/30'
        }`}>
            <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-tighter">Giới hạn thông số</label>
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">{t('min_val')}</label>
                    <input 
                        type="number" 
                        value={minValue}
                        onChange={e => setMinValue(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder={selectedType === 'TEMP' ? "20" : "6.5"}
                    />
                </div>
                <div className="h-px w-4 bg-slate-300 dark:bg-slate-600 mt-4"></div>
                <div className="flex-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">{t('max_val')}</label>
                    <input 
                        type="number" 
                        value={maxValue}
                        onChange={e => setMaxValue(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder={selectedType === 'TEMP' ? "30" : "8.5"}
                    />
                </div>
            </div>
        </div>

        {/* 3. Cấu hình Cảnh báo Email (Nhập thời gian cụ thể) */}
        <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/10">
            <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                <MailWarning size={14} />
                <label className="text-[9px] font-black uppercase tracking-tighter">Cấu hình thông báo</label>
            </div>
            
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Thời gian duy trì lỗi (phút)</span>
                </div>
                <input 
                    type="number"
                    min="0"
                    value={alertDelay}
                    onChange={e => setAlertDelay(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-center text-blue-600 dark:text-blue-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="VD: 15"
                />
                <p className="text-[8px] text-slate-400 italic text-center leading-relaxed">
                    {alertDelay === '0' || alertDelay === '' 
                        ? "Hệ thống sẽ gửi email ngay lập tức khi phát hiện bất thường." 
                        : `Nếu lỗi kéo dài liên tục trên ${alertDelay} phút, hệ thống sẽ gửi email cảnh báo.`}
                </p>
            </div>
        </div>

        {message && (
          <div className={`flex items-center gap-2 text-[10px] font-bold p-2 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {message.type === 'success' ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
            {message.text}
          </div>
        )}

        <button 
            onClick={handleSave} 
            disabled={loading || !minValue || !maxValue}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
            {t('save')}
        </button>
      </div>
    </div>
  );
};
