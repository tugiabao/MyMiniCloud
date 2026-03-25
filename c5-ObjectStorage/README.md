# c5-ObjectStorage

## Vai trò
Dịch vụ Object/File Storage có máy chủ tĩnh nhằm quản lý việc lưu trữ các tệp tài nguyên như hình ảnh, video, tệp đính kèm,... được gửi lên từ các service (ví dụ: `c2-app`).
- Cung cấp API tương thích S3 (như `S3-compatible API`) để upload và download dữ liệu dễ dàng.
- Quản lý các Bucket dữ liệu, access policy và phân quyền nhóm cho các đối tượng lưu trữ.

## Công nghệ sử dụng
- **MinIO**: Nền tảng Object Storage có hiệu năng cao, đặc biệt dễ triển khai và tương thích với chuẩn giao tiếp của AWS S3 API.

## Hướng dẫn
Sử dụng file `docker-compose.yml` đi kèm để khởi chạy máy chủ MinIO. Server sử dụng 2 cổng chính:
- **API Port (9000)**: Cổng cho hệ thống nội bộ giao tiếp và đẩy dữ liệu lên qua HTTP request.
- **Console Web (9001)**: Giao diện quản trị, xem danh sách bucket, tuỳ chỉnh access key.

Mặc định, username và mật khẩu kết nối `Root User` là:
- `MINIO_ROOT_USER`: minioadmin
- `MINIO_ROOT_PASSWORD`: miniopassword123
