# c4-Authentication

## Vai trò
Dịch vụ Quản lý định danh và Đăng nhập (Authentication Server).
- Quản lý người dùng, phân quyền (Roles & Permissions).
- Cấp phát và xác thực Token đăng nhập (JWT).
- Triển khai cơ chế Đăng nhập một lần (Single Sign-On - SSO).

## Công nghệ sử dụng
- **Keycloak**: Nền tảng Identity and Access Management nguồn mở chuyên nghiệp.
- **PostgreSQL**: (Tuỳ chọn) Lưu trữ dữ liệu hệ thống Keycloak.

## Hướng dẫn
Sử dụng file `docker-compose.yml` đi kèm để khởi chạy Keycloak. Mặc định nó sẽ chạy ở chế độ `start-dev` dùng cho mục đích phát triển.
Mật khẩu mặc định và user là `admin` / `admin`.
