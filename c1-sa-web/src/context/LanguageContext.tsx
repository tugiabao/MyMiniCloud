import React, { createContext, useContext, useState } from 'react';

type Language = 'vi' | 'en';

// --- Dictionary ---
const translations = {
  vi: {
    // Auth & General
    'welcome_back': 'Chào mừng trở lại',
    'create_account': 'Tạo tài khoản mới',
    'login_desc': 'Nhập thông tin để truy cập vào bảng điều khiển.',
    'register_desc': 'Bắt đầu quản lý hồ cá thông minh của bạn ngay hôm nay.',
    'login_btn': 'Đăng nhập',
    'register_btn': 'Đăng ký tài khoản',
    'email_placeholder': 'ten@gmail.com',
    'password': 'Mật khẩu',
    'full_name': 'Họ và tên',
    'forgot_password': 'Quên mật khẩu?',
    'or': 'Hoặc',
    'continue_google': 'Tiếp tục với Google',
    'dont_have_account': 'Chưa có tài khoản?',
    'already_have_account': 'Đã có tài khoản?',
    'register_now': 'Đăng ký ngay',
    'login_now': 'Đăng nhập',
    'register_success': 'Đăng ký thành công! Vui lòng kiểm tra email.',
    'action_failed': 'Thao tác thất bại! Vui lòng thử lại.',
    'google_login_failed': 'Đăng nhập Google thất bại',
    'loading': 'Đang xử lý...',
    'success': 'Thành công',
    'error': 'Lỗi',

    // Dashboard & Layout
    'dashboard': 'Tổng quan',
    'settings': 'Cài đặt',
    'logout': 'Đăng xuất',
    'system': 'Hệ thống',
    'search_placeholder': 'Tìm kiếm hồ cá...',
    'filter': 'Lọc',
    'add_new': 'Thêm thiết bị mới',
    'my_devices': 'Danh sách thiết bị',
    'online': 'Trực tuyến',
    'offline': 'Mất kết nối',
    'view_detail': 'Xem chi tiết',
    'manage': 'Quản lý',

    // Add New System Modal
    'register_new_system': 'Đăng ký hồ cá mới',
    'enter_system_info': 'Nhập thông tin mã hệ thống của bạn',
    'system_code': 'Mã hệ thống (VD: SA01)',
    'system_code_placeholder': 'Nhập mã...',
    'system_name': 'Tên gợi nhớ',
    'system_name_placeholder': 'VD: Hồ cá phòng khách',
    'register': 'Đăng ký',
    'cancel': 'Hủy bỏ',

    // Detail Page
    'aquarium_detail': 'Chi tiết hồ cá',
    'monitor_control': 'Giám sát thông số và điều khiển thiết bị',
    'back_to_dashboard': 'Quay lại',
    'temp_water': 'Nhiệt độ nước',
    'water_level': 'Mực nước',
    'water_low': 'THIẾU',
    'water_good': 'ĐỦ',
    'ph_level': 'Độ kiềm (pH)',
    'camera': 'Camera Giám Sát',
    'camera_name': 'Camera AI',
    'stable': 'Ổn định',
    'ideal': 'Lý tưởng',
    'live_feed': 'Trực tiếp',
    'ai_detection': 'Nhận diện AI',
    'start_stream': 'Bật Camera',
    'stop_stream': 'Tắt Camera',
    'chart_temp': 'Biểu đồ nhiệt độ',
    'chart_ph': 'Biểu đồ độ pH',
    'logs': 'Nhật ký hoạt động',

    // Device Controls
    'device_control': 'Điều khiển thiết bị',
    'relay_1': 'Lọc nước (Relay 1)',
    'relay_2': 'Sục khí (Relay 2)',
    'relay_3': 'Quạt tản nhiệt (Relay 3)',
    'feeder': 'Máy cho ăn',
    'feed_now': 'Cho ăn ngay',
    'feeding': 'Đang cho ăn...',
    'light_intensity': 'Cường độ đèn',
    'measure_ph': 'Đo độ pH',
    'measuring': 'Đang đo...',

    // Automation
    'automation': 'Tự động hóa',
    'automation_desc': 'Cài đặt lịch trình bật tắt thiết bị tự động',
    'add_schedule': 'Thêm lịch mới',
    'device': 'Thiết bị',
    'action': 'Hành động',
    'start_time': 'Bắt đầu',
    'duration': 'Thời lượng',
    'minutes': 'phút',
    'delete': 'Xóa',
    'active': 'Kích hoạt',
    'inactive': 'Tắt',
    'save_schedule': 'Lưu lịch trình',
    'select_device': 'Chọn thiết bị',
    'turn_on': 'Bật',
    'turn_off': 'Tắt',

    // Settings & Profile
    'system_settings': 'Cài đặt hệ thống',
    'theme': 'Giao diện',
    'light': 'Sáng',
    'dark': 'Tối',
    'language': 'Ngôn ngữ',
    'save': 'Lưu thay đổi',
    'profile': 'Hồ sơ cá nhân',
    'email': 'Email',
    'phone': 'Số điện thoại',
    'address': 'Địa chỉ',
    'gender': 'Giới tính',
    'birthday': 'Ngày sinh',
    'male': 'Nam',
    'female': 'Nữ',
    'other': 'Khác',
    'update_success': 'Cập nhật thành công',
    'safe_thresholds': 'Ngưỡng an toàn',
    'safe_thresholds_desc': 'Cài đặt giới hạn cảnh báo',
    'min_val': 'Thấp nhất',
    'max_val': 'Cao nhất',
    'temp_threshold': 'Ngưỡng nhiệt độ',
    'ph_threshold': 'Ngưỡng pH',
    'system_deleted_success': 'Xóa hệ thống thành công',
    'system_delete_failed': 'Xóa hệ thống thất bại',
  },
  en: {
    // Auth & General
    'welcome_back': 'Welcome back',
    'create_account': 'Create an account',
    'login_desc': 'Enter your credentials to access the dashboard.',
    'register_desc': 'Start managing your smart aquarium today.',
    'login_btn': 'Sign In',
    'register_btn': 'Register',
    'email_placeholder': 'name@example.com',
    'password': 'Password',
    'full_name': 'Full Name',
    'forgot_password': 'Forgot password?',
    'or': 'Or',
    'continue_google': 'Continue with Google',
    'dont_have_account': "Don't have an account?",
    'already_have_account': 'Already have an account?',
    'register_now': 'Register now',
    'login_now': 'Sign In',
    'register_success': 'Registration successful! Please check your email.',
    'action_failed': 'Action failed! Please try again.',
    'google_login_failed': 'Google login failed',
    'loading': 'Loading...',
    'success': 'Success',
    'error': 'Error',

    // Dashboard & Layout
    'dashboard': 'Dashboard',
    'settings': 'Settings',
    'logout': 'Logout',
    'system': 'System',
    'search_placeholder': 'Search aquarium...',
    'filter': 'Filter',
    'add_new': 'Add New Device',
    'my_devices': 'My Devices',
    'online': 'Online',
    'offline': 'Offline',
    'view_detail': 'View Detail',
    'manage': 'Manage',

    // Add New System Modal
    'register_new_system': 'Register New System',
    'enter_system_info': 'Enter your system code to connect',
    'system_code': 'System Code (e.g., SA01)',
    'system_code_placeholder': 'Enter code...',
    'system_name': 'Friendly Name',
    'system_name_placeholder': 'e.g., Living Room Tank',
    'register': 'Register',
    'cancel': 'Cancel',

    // Detail Page
    'aquarium_detail': 'Aquarium Detail',
    'monitor_control': 'Monitor parameters and control devices',
    'back_to_dashboard': 'Back',
    'temp_water': 'Water Temp',
    'water_level': 'Water Level',
    'water_low': 'LOW',
    'water_good': 'GOOD',
    'ph_level': 'pH Level',
    'camera': 'Surveillance Camera',
    'camera_name': 'AI Camera',
    'stable': 'Stable',
    'ideal': 'Ideal',
    'live_feed': 'Live Feed',
    'ai_detection': 'AI Detection',
    'start_stream': 'Start Camera',
    'stop_stream': 'Stop Camera',
    'chart_temp': 'Temperature Chart',
    'chart_ph': 'pH Chart',
    'logs': 'Activity Logs',

    // Device Controls
    'device_control': 'Device Control',
    'relay_1': 'Water filter (Relay 1)',
    'relay_2': 'Air pump (Relay 2)',
    'relay_3': 'Fan (Relay 3)',
    'feeder': 'Fish Feeder',
    'feed_now': 'Feed Now',
    'feeding': 'Feeding...',
    'light_intensity': 'Light Intensity',
    'measure_ph': 'Measure pH',
    'measuring': 'Measuring...',

    // Automation
    'automation': 'Automation',
    'automation_desc': 'Schedule automated device actions',
    'add_schedule': 'Add Schedule',
    'device': 'Device',
    'action': 'Action',
    'start_time': 'Start Time',
    'duration': 'Duration',
    'minutes': 'mins',
    'delete': 'Delete',
    'active': 'Active',
    'inactive': 'Inactive',
    'save_schedule': 'Save Schedule',
    'select_device': 'Select Device',
    'turn_on': 'Turn On',
    'turn_off': 'Turn Off',

    // Settings & Profile
    'system_settings': 'System Settings',
    'theme': 'Appearance',
    'light': 'Light',
    'dark': 'Dark',
    'language': 'Language',
    'save': 'Save Changes',
    'profile': 'My Profile',
    'email': 'Email',
    'phone': 'Phone Number',
    'address': 'Address',
    'gender': 'Gender',
    'birthday': 'Birthday',
    'male': 'Male',
    'female': 'Female',
    'other': 'Other',
    'update_success': 'Update successful',
    'safe_thresholds': 'Safe Thresholds',
    'safe_thresholds_desc': 'Set alert limits',
    'min_val': 'Min Value',
    'max_val': 'Max Value',
    'temp_threshold': 'Temp Threshold',
    'ph_threshold': 'pH Threshold',
    'system_deleted_success': 'System deleted successfully',
    'system_delete_failed': 'Failed to delete system',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['vi']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('app-lang') as Language) || 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-lang', lang);
  };

  const t = (key: keyof typeof translations['vi']) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};