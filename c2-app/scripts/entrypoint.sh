#!/bin/sh
set -e

# Chờ Database (c3) sẵn sàng
echo "Waiting for database to be ready..."
while ! nc -z c3 5432; do
  sleep 1
done
echo "Database is up!"

# TỰ ĐỘNG KHỞI TẠO (Đây là linh hồn của Giải pháp 2)
# Nếu chưa có thư mục migrations, tự động làm từ A-Z
if [ ! -d "migrations" ]; then
    echo "First time setup: Initializing migrations..."
    flask db init
    flask db migrate -m "Initial migration"
fi

# Luôn cập nhật bảng mới nhất
echo "Applying database migrations..."
flask db upgrade

# Chạy App
echo "Starting Application Server..."
exec "$@"