import React from 'react';
import { UserProfile } from '../common/UserProfile';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <header className="h-16 bg-blue-600 dark:bg-slate-800 flex items-center justify-between px-4 lg:px-8 shadow-sm z-[60] sticky top-0 transition-all duration-300">
                <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-8 h-8 lg:w-9 lg:h-9 bg-white/20 backdrop-blur-md dark:bg-slate-700 rounded-lg flex items-center justify-center text-white transition-colors overflow-hidden">
                        <img src="/SA_icon.jpg" alt="App Icon" className="w-full h-full object-cover" style={{ transform: 'scale(1.34) translateY(2%)' }} />
                    </div>
                    <span className="font-bold text-lg lg:text-xl text-white uppercase tracking-tight">Azura IoT</span>
                </div>
                <UserProfile />
            </header>
            <main className="flex-1 w-full max-w-none p-4 overflow-hidden">
                {children}
            </main>
        </div>
    );
};
