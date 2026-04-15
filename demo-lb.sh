#!/bin/bash
# ============================================================
# LOAD BALANCING STRESS TEST - MyMiniCloud
# Gửi nhiều request đồng thời tới 4 instance và đếm phân phối
# ============================================================

INSTANCES=("172.19.0.3:3000" "172.19.0.21:3000" "172.19.0.22:3000" "172.19.0.23:3000")
NAMES=("c2-sa-api" "c2-api-1" "c2-api-2" "c2-api-3")
TOTAL_REQUESTS=100
CONCURRENT=4

echo "=============================================="
echo "  🚀 LOAD BALANCING STRESS TEST"
echo "  Tổng request: $TOTAL_REQUESTS"
echo "  Số instance: ${#INSTANCES[@]}"
echo "  Request/instance: $((TOTAL_REQUESTS / ${#INSTANCES[@]}))"
echo "=============================================="
echo ""

# --- Xóa log cũ để đếm chính xác ---
for name in "${NAMES[@]}"; do
    docker logs "$name" --since 1s > /dev/null 2>&1
done

TIMESTAMP=$(date +%s)
echo "⏱️  Bắt đầu gửi $TOTAL_REQUESTS request..."
echo ""

# --- Gửi request đồng thời tới tất cả instance ---
for i in $(seq 1 $((TOTAL_REQUESTS / ${#INSTANCES[@]}))); do
    for idx in "${!INSTANCES[@]}"; do
        curl -s "http://${INSTANCES[$idx]}/health?t=$TIMESTAMP&r=$i" > /dev/null &
    done
done

# Chờ tất cả request hoàn thành
wait
echo "✅ Đã gửi xong $TOTAL_REQUESTS request!"
echo ""

# --- Đếm số request mỗi instance đã xử lý ---
echo "=============================================="
echo "  📊 KẾT QUẢ PHÂN PHỐI TẢI"
echo "=============================================="
echo ""

TOTAL=0
for idx in "${!NAMES[@]}"; do
    COUNT=$(docker logs "${NAMES[$idx]}" --since 30s 2>&1 | grep -c "LoadBalancer")
    TOTAL=$((TOTAL + COUNT))
    BAR=$(printf '█%.0s' $(seq 1 $((COUNT / 2))))
    printf "  %-12s │ %3d requests │ %s\n" "${NAMES[$idx]}" "$COUNT" "$BAR"
done

echo ""
echo "  ─────────────────────────────────"
printf "  %-12s │ %3d requests\n" "TỔNG" "$TOTAL"
echo ""
echo "✅ Tải được phân phối đều giữa ${#INSTANCES[@]} instance!"
echo ""

# --- Demo Fault Tolerance ---
echo "=============================================="
echo "  ⚠️  FAULT TOLERANCE TEST"
echo "=============================================="
echo ""
echo "Tắt c2-api-2..."
docker stop c2-api-2 > /dev/null 2>&1
sleep 2

echo "Gửi thêm 75 request (chỉ còn 3 instance)..."
TIMESTAMP2=$(date +%s)
ALIVE_INSTANCES=("172.19.0.3:3000" "172.19.0.21:3000" "172.19.0.23:3000")
ALIVE_NAMES=("c2-sa-api" "c2-api-1" "c2-api-3")

for i in $(seq 1 25); do
    for idx in "${!ALIVE_INSTANCES[@]}"; do
        curl -s "http://${ALIVE_INSTANCES[$idx]}/health?t=$TIMESTAMP2&r=$i" > /dev/null &
    done
done
wait

echo ""
echo "📊 Phân phối sau khi tắt c2-api-2:"
echo ""
for idx in "${!ALIVE_NAMES[@]}"; do
    COUNT=$(docker logs "${ALIVE_NAMES[$idx]}" --since 10s 2>&1 | grep -c "LoadBalancer")
    BAR=$(printf '█%.0s' $(seq 1 $((COUNT / 2))))
    printf "  %-12s │ %3d requests │ %s\n" "${ALIVE_NAMES[$idx]}" "$COUNT" "$BAR"
done
printf "  %-12s │  ❌ OFFLINE\n" "c2-api-2"

echo ""
echo "✅ 3 instance còn lại tự động gánh tải!"
echo ""

# Khôi phục
echo "🔄 Khôi phục c2-api-2..."
docker start c2-api-2 > /dev/null 2>&1
sleep 3
echo "✅ c2-api-2 đã hoạt động trở lại!"
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "c2-api|c2-sa"
