import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import keycloak from './lib/keycloak';

// Khởi tạo Keycloak trước khi render App
keycloak
  .init({
    onLoad: 'login-required', // Bắt buộc đăng nhập để xem app
    checkLoginIframe: false,
  })
  .then((authenticated) => {
    if (authenticated) {
      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <App />
        </StrictMode>
      );
    }
  })
  .catch((err) => {
    console.error('Keycloak initialization failed', err);
    // Hiển thị thông báo lỗi nếu không kết nối được Keycloak
    document.body.innerHTML = `<div style="text-align:center; padding: 50px; color: red;"><h1>Lỗi xác thực</h1><p>Không thể kết nối đến máy chủ Keycloak. Vui lòng kiểm tra lại cấu hình.</p></div>`;
  });
