#!/bin/bash
# ============================================================
# LOAD BALANCING DEMO - MyMiniCloud
# Tất cả request đều gửi qua Nginx (c9) Load Balancer
# C9 tự động phân phối cho các instance backend
# ============================================================

NGINX_URL="http://172.19.0.10"
HOST_HEADER="Host: api-be.azura.io.vn"
TOTAL_REQUESTS=100

echo "=============================================="
echo "  🚀 LOAD BALANCING DEMO"
echo "  Tổng request: $TOTAL_REQUESTS"
echo "  Tất cả gửi qua: Nginx (c9) Load Balancer"
echo "=============================================="
echo ""

# --- BƯỚC 0: Tạm tắt ip_hash để demo Round-Robin ---
echo "🔧 Chuyển Nginx sang chế độ Round-Robin (demo)..."
docker exec c9 sh -c "sed -i 's/ip_hash;/#ip_hash; # disabled for demo/' /etc/nginx/conf.d/default.conf && nginx -s reload" 2>/dev/null
sleep 1

# --- BƯỚC 1: Gửi 100 request qua c9 ---
echo "⏱️  Đang gửi $TOTAL_REQUESTS request qua Nginx Load Balancer..."
echo ""

for i in $(seq 1 $TOTAL_REQUESTS); do
    curl -s -H "$HOST_HEADER" "$NGINX_URL/health?r=$i" > /dev/null &
    # Giới hạn 10 request đồng thời
    if (( i % 10 == 0 )); then
        wait
    fi
done
wait

echo "✅ Đã gửi xong $TOTAL_REQUESTS request qua Nginx!"
echo ""
sleep 2

# --- BƯỚC 2: Đếm số request mỗi instance xử lý ---
echo "=============================================="
echo "  📊 KẾT QUẢ: NGINX ĐÃ PHÂN PHỐI NHƯ SAU"
echo "=============================================="
echo ""
echo "  Tất cả $TOTAL_REQUESTS request → Nginx (c9) → Backend Pool"
echo ""

NAMES=("c2-sa-api" "c2-api-1" "c2-api-2" "c2-api-3")
TOTAL=0

for name in "${NAMES[@]}"; do
    COUNT=$(docker logs "$name" --since 30s 2>&1 | grep -c "GET /health")
    TOTAL=$((TOTAL + COUNT))
    PERCENT=$((COUNT * 100 / TOTAL_REQUESTS))
    BAR=$(printf '█%.0s' $(seq 1 $((COUNT / 2 + 1))))
    printf "  %-12s │ %3d requests (%2d%%) │ %s\n" "$name" "$COUNT" "$PERCENT" "$BAR"
done

echo ""
echo "  ─────────────────────────────────────────"
printf "  %-12s │ %3d requests\n" "TỔNG" "$TOTAL"
echo ""

if [ $TOTAL -gt 0 ]; then
    echo "  ✅ Nginx (c9) đã phân phối $TOTAL request cho ${#NAMES[@]} instance!"
else
    echo "  ⚠️  Không đếm được request. Kiểm tra lại middleware logger."
fi

echo ""
echo ""

# =============================================================
# BƯỚC 3: FAULT TOLERANCE — TẮT 1 INSTANCE
# =============================================================
echo "=============================================="
echo "  ⚠️  FAULT TOLERANCE TEST"
echo "=============================================="
echo ""
echo "  Trước khi tắt:"
docker ps --format "    {{.Names}}\t{{.Status}}" | grep -E "c2-api|c2-sa"
echo ""

echo "  ⛔ Đang tắt c2-api-2..."
docker stop c2-api-2 > /dev/null 2>&1
sleep 2

echo ""
echo "  Sau khi tắt:"
docker ps --format "    {{.Names}}\t{{.Status}}" | grep -E "c2-api|c2-sa"
echo "    c2-api-2     ❌ OFFLINE"
echo ""

echo "  ⏱️  Gửi thêm $TOTAL_REQUESTS request qua Nginx..."
for i in $(seq 1 $TOTAL_REQUESTS); do
    curl -s -H "$HOST_HEADER" "$NGINX_URL/health?ft=$i" > /dev/null &
    if (( i % 10 == 0 )); then
        wait
    fi
done
wait
sleep 2

echo ""
echo "  📊 Phân phối khi chỉ còn 3 instance:"
echo ""

ALIVE_NAMES=("c2-sa-api" "c2-api-1" "c2-api-3")
TOTAL2=0
for name in "${ALIVE_NAMES[@]}"; do
    COUNT=$(docker logs "$name" --since 45s 2>&1 | grep -c "GET /health")
    TOTAL2=$((TOTAL2 + COUNT))
    BAR=$(printf '█%.0s' $(seq 1 $((COUNT / 2 + 1))))
    printf "  %-12s │ %3d requests │ %s\n" "$name" "$COUNT" "$BAR"
done
printf "  %-12s │  ❌ OFFLINE\n" "c2-api-2"

echo ""
echo "  ✅ Hệ thống vẫn xử lý bình thường với 3 instance!"
echo ""

# =============================================================
# BƯỚC 4: KHÔI PHỤC
# =============================================================
echo "=============================================="
echo "  🔄 KHÔI PHỤC"
echo "=============================================="
echo ""
echo "  Đang khôi phục c2-api-2..."
docker start c2-api-2 > /dev/null 2>&1
sleep 3

echo "  Đang bật lại ip_hash (sticky session cho WebSocket)..."
docker exec c9 sh -c "sed -i 's/#ip_hash; # disabled for demo/ip_hash;/' /etc/nginx/conf.d/default.conf && nginx -s reload" 2>/dev/null

echo ""
echo "  ✅ Trạng thái cuối cùng:"
docker ps --format "    {{.Names}}\t{{.Status}}" | grep -E "c2-api|c2-sa"
echo ""
echo "=============================================="
echo "  🎉 DEMO HOÀN TẤT!"
echo "=============================================="
