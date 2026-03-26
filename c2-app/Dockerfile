FROM python:3.10-slim

# Cài đặt netcat (nc) để script entrypoint chờ Database sẵn sàng
RUN apt-get update && \
    apt-get install -y netcat-traditional && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements và cài đặt thư viện trước để tận dụng cache của Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code vào container
COPY . .

# Cấp quyền thực thi cho script khởi chạy
RUN chmod +x ./scripts/entrypoint.sh

# Sử dụng entrypoint để quản lý luồng: Chờ DB -> Migrate -> Chạy App
ENTRYPOINT ["sh", "./scripts/entrypoint.sh"]