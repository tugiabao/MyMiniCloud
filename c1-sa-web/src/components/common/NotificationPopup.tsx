import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationPopupProps {
    message: string;
    type: NotificationType;
    onClose: () => void;
    duration?: number;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
    message,
    type,
    onClose,
    duration = 3000
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 animate-in zoom-in spin-in-180 duration-500"><CheckCircle2 className="text-green-600 dark:text-green-500" size={64} /></div>;
            case 'error': return <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4 animate-in zoom-in duration-300"><XCircle className="text-red-600 dark:text-red-500" size={64} /></div>;
            case 'warning': return <div className="p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4 animate-in zoom-in duration-300"><AlertTriangle className="text-yellow-600 dark:text-yellow-500" size={64} /></div>;
            default: return <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4 animate-in zoom-in duration-300"><Info className="text-blue-600 dark:text-blue-500" size={64} /></div>;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Content */}
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-300 border border-slate-100 dark:border-slate-800">
                {getIcon()}

                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    {type === 'success' ? 'Thành công!' : type === 'error' ? 'Thất bại!' : 'Thông báo'}
                </h3>

                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {message}
                </p>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
