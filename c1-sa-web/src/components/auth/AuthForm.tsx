import React from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export const AuthForm = () => {
    const auth = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Tự động chuyển trang sau khi đăng nhập thành công
    React.useEffect(() => {
        if (auth.isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [auth.isAuthenticated, navigate]);

    if (auth.isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <Loader2 size={32} className="animate-spin text-blue-600" />
                <p className="text-slate-500 font-medium">Đang kiểm tra phiên đăng nhập...</p>
            </div>
        );
    }

    if (auth.error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                <p className="font-bold">Lỗi đăng nhập:</p>
                <p className="text-sm">{auth.error.message}</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 flex flex-col items-center text-center">
            <div className="mb-8 mt-4">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {t('welcome_back')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm max-w-sm">
                    Hệ thống đã được nâng cấp lên MyMiniCloud. Vui lòng đăng nhập qua cổng xác thực tập trung SSO.
                </p>
            </div>

            <button
                onClick={() => auth.signinRedirect()}
                className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
                <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                Đăng nhập hệ thống nội bộ
            </button>
        </div>
    );
};