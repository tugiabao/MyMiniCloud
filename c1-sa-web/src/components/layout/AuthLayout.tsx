import React from 'react';
import backgroundImage from '../../assets/Background.png';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* --- Left Side: Brand & Image (Hidden on Mobile) --- */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/3 relative bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={backgroundImage} 
            alt="Aquarium Background" 
            className="w-full h-full object-cover opacity-80"
          />
          {/* Darker Gradient Overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/40 to-transparent"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-md">
                <span className="text-2xl">🐟</span>
             </div>
             <span className="font-bold text-xl tracking-wide">AZURA IOT</span>
          </div>

          <div className="max-w-lg mb-12">
            <h1 className="text-5xl font-black mb-6 leading-tight drop-shadow-sm uppercase tracking-tight">
              Hệ sinh thái <br/>
              <span className="text-blue-400">Hồ cá thông minh</span>
            </h1>
            <p className="text-slate-100 text-lg font-medium leading-relaxed drop-shadow-sm max-w-md">
              Giám sát thông số thời gian thực và điều khiển thiết bị từ xa với công nghệ IoT tiên tiến nhất.
            </p>
          </div>
          
          <div className="flex justify-between items-center text-xs text-slate-300 font-semibold tracking-wider uppercase">
             <span>© 2026 Azura IoT System</span>
             <span className="text-blue-300">v1.0.0</span>
          </div>
        </div>
      </div>

      {/* --- Right Side: Form Container --- */}
      <div className="w-full lg:w-1/2 xl:w-1/3 flex items-center justify-center p-6 sm:p-12 overflow-y-auto bg-slate-50/30 dark:bg-slate-900 lg:bg-white lg:dark:bg-slate-900 transition-colors duration-300">
        <div className="w-full max-w-sm">
           {children}
        </div>
      </div>
    </div>
  );
};
