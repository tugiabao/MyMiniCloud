FROM ubuntu/bind9:latest

# Cài đặt công cụ thay thế biến môi trường
RUN apt-get update && apt-get install -y gettext-base dnsutils && rm -rf /var/lib/apt/lists/*

# Copy các file cấu hình (lúc này là bản mẫu)
COPY named.conf.options /etc/bind/named.conf.options
COPY named.conf.local /etc/bind/named.conf.local
COPY db.myminicloud.local /etc/bind/db.template

# Lệnh khởi động: Thay thế biến vào file thật rồi mới chạy Bind9
CMD envsubst '$DOMAIN_NAME $IP_C1 $IP_C2 $IP_C3 $IP_C4 $IP_C5 $IP_C6 $IP_C7 $IP_C8 $IP_C9 $IP_C1_BLOG $IP_C3_DBVIEW $IP_CADVISOR' < /etc/bind/db.template > /etc/bind/db.myminicloud.local && /usr/sbin/named -g -c /etc/bind/named.conf -u bind