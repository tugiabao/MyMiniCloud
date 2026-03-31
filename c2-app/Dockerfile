FROM python:3.10-slim

# 1. Thiết lập thư mục làm việc ngay từ đầu
WORKDIR /app

# 2. Cài đặt các công cụ hệ thống (Gộp chung để giảm dung lượng Image)
# netcat-traditional dùng để kiểm tra kết nối Database
# dos2unix dùng để sửa lỗi định dạng file từ Windows sang Linux
RUN apt-get update && apt-get install -y \
    dos2unix \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# 3. Copy file script vào trước để xử lý (Rất quan trọng)
COPY scripts/entrypoint.sh ./scripts/entrypoint.sh

# 4. Sửa lỗi định dạng và cấp quyền thực thi cho script
RUN dos2unix ./scripts/entrypoint.sh && chmod +x ./scripts/entrypoint.sh

# 5. Copy requirements và cài đặt thư viện (Tận dụng Docker Cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy toàn bộ mã nguồn còn lại của ứng dụng vào container
COPY . .

# 7. Sử dụng entrypoint để quản lý luồng khởi động
# Luồng hoạt động: Chờ Database sẵn sàng -> Chạy App (Không chạy Migration)
ENTRYPOINT ["sh", "./scripts/entrypoint.sh"]