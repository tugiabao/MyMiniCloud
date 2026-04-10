import React, { useState } from 'react';
import {
  User, Settings, LogOut, ChevronDown,
  UserCircle, X, Moon, Sun, Globe, Check,
  Mail, Phone, MapPin, Calendar, Users, Edit2, Save
} from 'lucide-react';
import { useAuth } from '../../controllers/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { AxiosError } from 'axios';
import { NotificationPopup, type NotificationType } from './NotificationPopup';

export const UserProfile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-white/10 dark:hover:bg-black/5 transition-all border border-transparent hover:border-white/20 dark:hover:border-slate-300 group outline-none"
        >
          <div className="w-9 h-9 rounded-full bg-white/20 dark:bg-slate-300 p-0.5 shadow-sm">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-full h-full text-slate-400" />
              )}
            </div>
          </div>

          <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-xs font-bold text-white dark:text-white leading-tight transition-colors">
              {user?.fullName || "Người dùng"}
            </span>
            <span className="text-[10px] font-medium text-blue-200/80 dark:text-white leading-tight transition-colors">Thành viên</span>
          </div>
          <ChevronDown size={14} className="text-blue-100 dark:text-slate-600 transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[70] overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-bold text-slate-800">{user?.fullName}</p>
                <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
              </div>
              <div className="p-2 space-y-1">
                <MenuItem
                  icon={<User size={16} />}
                  label={t('profile')}
                  onClick={() => {
                    setIsOpen(false);
                    setShowProfileModal(true);
                  }}
                />
                <MenuItem
                  icon={<Settings size={16} />}
                  label={t('system_settings')}
                  onClick={() => {
                    setIsOpen(false);
                    setShowSettingsModal(true);
                  }}
                />
                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                <MenuItem icon={<LogOut size={16} />} label={t('logout')} danger onClick={logout} />
              </div>
            </div>
          </>
        )}
      </div>

      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
    </>
  );
};

// --- Sub-components để giải quyết lỗi Unused ---

const MenuItem = ({ icon, label, danger, onClick }: { icon: React.ReactNode, label: string, danger?: boolean, onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
      }`}
  >
    {icon} {label}
  </button>
);

const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('system_settings')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Giao diện (Theme) */}
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 block flex items-center gap-2">
              <Sun size={18} className="text-blue-600" />
              {t('theme')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => toggleTheme('light')}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
              >
                <Sun size={24} />
                <span className="text-xs font-bold mt-2">{t('light')}</span>
              </button>
              <button
                onClick={() => toggleTheme('dark')}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
              >
                <Moon size={24} />
                <span className="text-xs font-bold mt-2">{t('dark')}</span>
              </button>
            </div>
          </div>

          {/* Ngôn ngữ (Language) */}
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 block flex items-center gap-2">
              <Globe size={18} className="text-blue-600" />
              {t('language')}
            </label>
            <div className="space-y-2">
              <button onClick={() => setLanguage('vi')} className={`w-full flex justify-between p-3 rounded-xl border ${language === 'vi' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800'}`}>
                <span className="text-sm font-bold dark:text-slate-200">🇻🇳 Tiếng Việt</span>
                {language === 'vi' && <Check size={18} className="text-blue-600" />}
              </button>
              <button onClick={() => setLanguage('en')} className={`w-full flex justify-between p-3 rounded-xl border ${language === 'en' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800'}`}>
                <span className="text-sm font-bold dark:text-slate-200">🇺🇸 English</span>
                {language === 'en' && <Check size={18} className="text-blue-600" />}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-md">
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileModal = ({ onClose }: { onClose: () => void }) => {
  const { user, updateProfile, loading } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: NotificationType } | null>(null);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    gender: user?.gender || '',
    birthday: user?.birthday || ''
  });

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      setNotification({ message: "Cập nhật thông tin thành công!", type: 'success' });
    } catch (err: unknown) { // 1. Chuyển any thành unknown
      console.error("Update profile error:", err);

      // 2. Ép kiểu an toàn sang AxiosError với cấu trúc message từ Backend
      const axiosError = err as AxiosError<{ message: string }>;

      // 3. Truy xuất message an toàn
      const msg = axiosError.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.";
      setNotification({ message: msg, type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      {notification && (
        <NotificationPopup
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('profile')}</h3>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-full transition-colors" title="Chỉnh sửa">
                <Edit2 size={18} />
              </button>
            ) : (
              <button onClick={handleSave} disabled={loading} className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 rounded-full transition-colors" title="Lưu">
                <Save size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-3 border-2 border-blue-100 dark:border-blue-900/30 overflow-hidden shadow-inner">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-12 h-12 text-blue-500" />
              )}
            </div>
            {isEditing ? (
              <input
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="text-center text-lg font-bold text-slate-800 dark:text-white border-b-2 border-blue-500 outline-none bg-transparent w-full"
                placeholder="Họ và tên"
              />
            ) : (
              <h4 className="text-xl font-bold text-slate-800 dark:text-white">{user?.fullName || "Người dùng"}</h4>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <Mail className="text-slate-400" size={18} />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <Phone className="text-slate-400" size={18} />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Số điện thoại</p>
                {isEditing ? (
                  <input
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 dark:text-white"
                    placeholder="Nhập số điện thoại"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.phone || "Chưa cập nhật"}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <MapPin className="text-slate-400" size={18} />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Địa chỉ</p>
                {isEditing ? (
                  <input
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 dark:text-white"
                    placeholder="Nhập địa chỉ"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.address || "Chưa cập nhật"}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <Users className="text-slate-400" size={18} />
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Giới tính</p>
                  {isEditing ? (
                    <select
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 py-1 text-sm outline-none focus:border-blue-500 dark:text-white"
                    >
                      <option value="">Chọn</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {user?.gender === 'male' ? 'Nam' : user?.gender === 'female' ? 'Nữ' : 'Khác'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <Calendar className="text-slate-400" size={18} />
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Ngày sinh</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 py-1 text-sm outline-none focus:border-blue-500 dark:text-white"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.birthday || "--/--/----"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};