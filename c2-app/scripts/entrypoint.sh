#!/bin/sh
set -e

# 1. Chờ DNS (c6) sẵn sàng trả lời tên miền
echo "Waiting for DNS service (c6)..."
until nslookup c3.myminicloud.local > /dev/null 2>&1; do
  echo "DNS c6 is not ready yet. Sleeping..."
  sleep 2
done

# 2. Chờ Database (c3) mở cổng 5432
echo "Waiting for PostgreSQL (c3) to be ready..."
while ! nc -z c3.myminicloud.local 5432; do
  sleep 2
done

echo "Database is UP and DNS is resolved!"

# 3. Thực hiện Migration (Vì bạn đã xác định sẽ chạy)
echo "Running database migrations..."
flask db upgrade

# 4. Khởi động ứng dụng chính
echo "Starting Application..."
exec python main.py