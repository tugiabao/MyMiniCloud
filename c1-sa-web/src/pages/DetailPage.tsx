import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { useSensors } from '../controllers/useSensors';
import { VideoMonitor } from '../components/aquarium/VideoMonitor';
import { DeviceControls } from '../components/aquarium/DeviceControls';
import { AutomationConfig } from '../components/aquarium/AutomationConfig';
import { SafeThresholds } from '../components/aquarium/SafeThresholds';
import { TempChart } from '../components/aquarium/TempChart';
import { PhChart } from '../components/aquarium/PhChart';
import { Thermometer, Droplets, Activity, ArrowLeft, ChevronLeft, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getStatusColor } from '../utils/statusUtils';

export const DetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // State cho Sidebar Mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Hook WebSocket mới
  const { sensorData, thresholds } = useSensors(id); 
  const status = sensorData?.status;
  const isOnline = status?.isOnline ?? false;

  // Tính toán màu sắc cho StatBox
  const tempStatus = getStatusColor(status?.temp || 0, thresholds?.temp, 2.0);
  const phStatus = getStatusColor(status?.ph || 0, thresholds?.ph, 0.5);

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-100px)] w-full gap-4 relative">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-3 sm:gap-0">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 bg-white/60 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-slate-800 font-bold text-sm text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md">
                <ArrowLeft size={16}/> <span className="hidden sm:inline">{t('back_to_dashboard')}</span>
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-base sm:text-xl font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">{t('system')}: {id}</h2>
                <span className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider border shadow-sm transition-colors ${isOnline ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'}`}>
                    <div className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                    {isOnline ? t('online').toUpperCase() : t('offline').toUpperCase()}
                </span>
            </div>
            <div className="hidden sm:block w-20"></div>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden relative">
            {/* --- LEFT SECTION (Main Content) --- */}
            <div className="w-full lg:w-[80%] flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-20 lg:pb-0">
                <div className="flex flex-col lg:flex-row h-auto lg:h-1/2 gap-4">
                    <div className="w-full lg:w-[90%] h-[250px] lg:h-auto bg-blue-50/40 dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-blue-100 dark:border-slate-800 transition-colors backdrop-blur-md order-2 lg:order-1">
                        <VideoMonitor systemName={id || ''} />
                    </div>
                    
                    <div className="w-full lg:w-[10%] flex flex-row lg:flex-col gap-3 order-1 lg:order-2">
                        <StatBox 
                            icon={<Thermometer/>} 
                            value={`${status?.temp?.toFixed(1) || 0}°`}
                            label={t('temp_water')} 
                            bg={tempStatus.status === 'red' ? "bg-red-50 dark:bg-red-900/20" : tempStatus.status === 'orange' ? "bg-orange-50 dark:bg-orange-900/20" : "bg-blue-50/60 dark:bg-blue-950/20"}
                            color={tempStatus.colorClass.split(' ')[0]} 
                        />
                        <StatBox 
                            icon={<Droplets/>} 
                            value={status?.liquid === 0 ? t('water_low') : t('water_good')} 
                            label={t('water_level')} 
                            bg={status?.liquid === 0 ? "bg-red-50/60 dark:bg-red-950/20" : "bg-blue-50/60 dark:bg-blue-950/20"}
                            color={status?.liquid === 0 ? "text-red-500" : "text-blue-500"} 
                        />
                        <StatBox 
                            icon={<Activity/>} 
                            value={`${status?.ph?.toFixed(1) || 0}`}
                            label={t('ph_level')} 
                            bg={phStatus.status === 'red' ? "bg-red-50 dark:bg-red-900/20" : phStatus.status === 'orange' ? "bg-orange-50 dark:bg-orange-900/20" : "bg-green-50/60 dark:bg-green-950/20"}
                            color={phStatus.colorClass.split(' ')[0]}
                        />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row h-auto lg:h-1/2 gap-4">
                    <div className="flex-1 h-[250px] lg:h-auto bg-white/60 dark:bg-slate-900 rounded-3xl p-4 border border-white/60 dark:border-slate-800 shadow-sm backdrop-blur-xl"><TempChart systemName={id || ''} /></div>
                    <div className="flex-1 h-[250px] lg:h-auto bg-white/60 dark:bg-slate-900 rounded-3xl p-4 border border-white/60 dark:border-slate-800 shadow-sm backdrop-blur-xl"><PhChart systemName={id || ''} /></div>
                </div>
            </div>

            {/* --- RIGHT SECTION (Controls Sidebar) --- */}
            {/* Desktop: Always Visible. Mobile: Drawer */}
            <>
                {/* Mobile Toggle Button */}
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-blue-600 text-white p-2 rounded-l-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 animate-in slide-in-from-right duration-300"
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Mobile Backdrop */}
                {isSidebarOpen && (
                    <div 
                        className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}

                {/* Sidebar Container */}
                <div className={`
                    fixed lg:static inset-y-0 right-0 z-50 
                    w-[85%] sm:w-[400px] lg:w-[20%] 
                    bg-white/95 dark:bg-slate-900/95 lg:bg-white/60 lg:dark:bg-slate-900 
                    border-l lg:border border-white/60 dark:border-slate-800 lg:rounded-3xl lg:shadow-sm 
                    flex flex-col overflow-hidden backdrop-blur-xl transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'}
                `}>
                    {/* Mobile Header for Sidebar */}
                    <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t('device_control')}</h3>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                        <section>
                            <SafeThresholds systemName={id || ''} />
                        </section>

                        <section>
                            <h3 className="text-xs font-black text-blue-400 dark:text-slate-500 uppercase tracking-widest mb-4 hidden lg:block">{t('device_control')}</h3>
                            <DeviceControls systemName={id || ''} />
                        </section>
                        <section>
                            <h3 className="text-xs font-black text-blue-400 dark:text-slate-500 uppercase tracking-widest mb-4">{t('automation')}</h3>
                            <AutomationConfig systemName={id || ''} />
                        </section>
                    </div>
                </div>
            </>
        </div>
      </div>
    </MainLayout>
  );
};

// Thành phần hiển thị thông số lẻ
const StatBox = ({ icon, value, label, bg, color }: { icon: React.ReactNode, value: string | number, label: string, bg: string, color: string }) => (
    <div className={`flex-1 ${bg} rounded-2xl border border-white dark:border-slate-800 flex flex-col items-center justify-center p-2 lg:p-3 shadow-sm transition-transform hover:scale-105 backdrop-blur-md min-w-0`}>
        <div className={`${color} scale-75 lg:scale-100`}>{icon}</div>
        <span className="text-sm lg:text-xl font-black text-slate-800 dark:text-white mt-0.5 lg:mt-1 truncate w-full text-center">{value}</span>
        <span className="text-[7px] lg:text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase text-center tracking-tighter truncate w-full">{label}</span>
    </div>
);
