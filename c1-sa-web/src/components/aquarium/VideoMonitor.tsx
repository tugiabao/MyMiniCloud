import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Disc, Loader2, PowerOff, RotateCw, BrainCircuit, Hand } from 'lucide-react';
import { useStream } from '../../controllers/useStream';
import { useSensors } from '../../controllers/useSensors'; 
import { useLanguage } from '../../context/LanguageContext';
import { streamService } from '../../services/streamService'; // 👈 Import streamService

type AiMode = 'fish' | 'hand' | 'off';

export const VideoMonitor = ({ systemName }: { systemName: string }) => {
  const { streamUrls, isStreaming, startStreaming, stopStreaming } = useStream();
  const { sensorData } = useSensors(systemName); 
  const { t } = useLanguage();
  
  const [reloadKey, setReloadKey] = useState(0); 
  const [isReloading, setIsReloading] = useState(false);
  
  // Mobile: Tab Index (0: Live, 1: AI/Hand)
  const [activeTab, setActiveTab] = useState<0 | 1>(0); 
  
  // Desktop & Logic: Chế độ AI hiện tại
  const [aiMode, setAiMode] = useState<AiMode>('off'); // Mặc định tắt để tiết kiệm

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isCameraOn = sensorData?.status.camera;

  useEffect(() => {
    startStreaming(systemName);
    return () => { stopStreaming(); };
  }, [systemName]);

  const toggleFullscreen = () => {
    if (containerRef.current) {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
  };

  const handleModeChange = async (mode: AiMode) => {
    setAiMode(mode);
    try {
        await streamService.setAiMode(mode);
    } catch (e) {
        console.error("Failed to switch AI mode:", e);
    }
  };

  const handleReload = async () => {
    setIsReloading(true);
    await startStreaming(systemName);
    setTimeout(() => {
      setReloadKey(prev => prev + 1);
      setIsReloading(false);
    }, 500);
  };

  // --- Logic Vuốt (Mobile) ---
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const onTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50 && activeTab === 0) setActiveTab(1);
    if (distance < -50 && activeTab === 1) setActiveTab(0);
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Hàm render 1 khung hình video
  const renderVideoFrame = (type: 'LIVE' | 'AI_FISH' | 'AI_HAND' | 'OFF') => {
    // 1. Nếu là chế độ OFF (cho màn hình phải)
    if (type === 'OFF') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-100 dark:bg-slate-900/50 transition-colors">
                <PowerOff size={32} className="text-slate-300 dark:text-slate-600" />
                <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">AI DISABLED</p>
            </div>
        );
    }

    if (!isCameraOn) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-100 dark:bg-slate-900/50 transition-colors">
          <div className="p-4 rounded-full bg-slate-200 dark:bg-slate-800">
            <PowerOff size={32} className="text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
            {t('stop_stream')}
          </p>
        </div>
      );
    }

    if (isReloading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-black/5 dark:bg-black/20 backdrop-blur-sm">
                <RotateCw size={32} className="text-blue-500 animate-spin" />
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">RELOADING...</p>
            </div>
        );
    }

    if (isStreaming && streamUrls) {
      let url = streamUrls.liveStreamUrl;
      
      // Logic URL cho các mode AI
      if (type === 'AI_FISH') url = streamUrls.aiUrl; 
      if (type === 'AI_HAND') url = streamUrls.aiUrl.replace('/video/ai', '/video/hand'); 

      return (
        <img 
          key={`${type}-${reloadKey}`}
          src={`${url}&t=${Date.now()}`} 
          alt={type} 
          className="w-full h-full object-cover animate-in fade-in duration-500 pointer-events-none select-none" 
          onError={() => {
              console.warn(`Mất kết nối luồng ${type}, thử lại sau 1s...`);
              setTimeout(() => setReloadKey(prev => prev + 1), 1000);
          }}
        />
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="text-blue-500 animate-spin" size={32} />
        <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">{t('loading')}</p>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="h-full w-full relative group">
        
        {/* --- DESKTOP LAYOUT (2 Columns) --- */}
        <div className="hidden lg:flex w-full h-full gap-4 p-2">
            {/* Left: LIVE */}
            <div className="flex-1 relative bg-slate-200 dark:bg-slate-900 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    {isCameraOn && <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse"><Disc size={10}/> LIVE</span>}
                </div>
                {renderVideoFrame('LIVE')}
            </div>

            {/* Right: AI / HAND / OFF */}
            <div className="flex-1 relative bg-slate-200 dark:bg-slate-900 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800">
                {/* Mode Switcher Overlay */}
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
                    <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10 gap-1">
                        <button 
                            onClick={() => handleModeChange('off')}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${aiMode === 'off' ? 'bg-slate-600 text-white' : 'text-slate-300 hover:text-white'}`}
                        >
                            OFF
                        </button>
                        <button 
                            onClick={() => handleModeChange('fish')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${aiMode === 'fish' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
                        >
                            <BrainCircuit size={12}/> Fish
                        </button>
                        <button 
                            onClick={() => handleModeChange('hand')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${aiMode === 'hand' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
                        >
                            <Hand size={12}/> Hand
                        </button>
                    </div>
                    
                    {isCameraOn && aiMode !== 'off' && (
                        <button onClick={handleReload} className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white shadow-lg transition-all active:scale-90 border border-white/10" title="Reload">
                            <RotateCw size={16} />
                        </button>
                    )}
                </div>

                {renderVideoFrame(aiMode === 'fish' ? 'AI_FISH' : aiMode === 'hand' ? 'AI_HAND' : 'OFF')}
            </div>
        </div>

        {/* --- MOBILE LAYOUT (Carousel) --- */}
        <div 
            className="lg:hidden h-full w-full relative bg-slate-200 dark:bg-slate-900 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800"
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        >
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                <div className="flex gap-2">
                    {activeTab === 0 ? (
                        isCameraOn && <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse"><Disc size={10}/> LIVE</span>
                    ) : (
                        // Mobile Controls
                        <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10 pointer-events-auto gap-1">
                             <button onClick={() => handleModeChange('off')} className={`px-2 py-1 rounded-full text-[9px] font-bold ${aiMode === 'off' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>OFF</button>
                             <button onClick={() => handleModeChange('fish')} className={`p-1.5 rounded-full ${aiMode === 'fish' ? 'bg-blue-500 text-white' : 'text-slate-400'}`}><BrainCircuit size={14}/></button>
                             <button onClick={() => handleModeChange('hand')} className={`p-1.5 rounded-full ${aiMode === 'hand' ? 'bg-purple-500 text-white' : 'text-slate-400'}`}><Hand size={14}/></button>
                        </div>
                    )}
                </div>
                {isCameraOn && activeTab === 1 && aiMode !== 'off' && <button onClick={handleReload} className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white pointer-events-auto"><RotateCw size={16} /></button>}
            </div>

            <div className="flex w-full h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${activeTab * 100}%)` }}>
                <div className="w-full h-full flex-shrink-0 relative">{renderVideoFrame('LIVE')}</div>
                <div className="w-full h-full flex-shrink-0 relative">{renderVideoFrame(aiMode === 'fish' ? 'AI_FISH' : aiMode === 'hand' ? 'AI_HAND' : 'OFF')}</div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-2 pointer-events-none">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeTab === 0 ? 'bg-white w-4' : 'bg-white/40'}`}></div>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeTab === 1 ? 'bg-white w-4' : 'bg-white/40'}`}></div>
            </div>
        </div>

        {/* Nút Fullscreen chung */}
        <button onClick={toggleFullscreen} className="absolute bottom-4 right-4 p-2.5 bg-black/20 hover:bg-black/30 text-white rounded-xl backdrop-blur-md z-30 opacity-0 lg:group-hover:opacity-100 lg:opacity-100 transition-all border border-white/10 pointer-events-auto">
            <Maximize2 size={20} />
        </button>
    </div>
  );
};
