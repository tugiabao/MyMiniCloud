@echo off
cd /d "D:\Current subject\Cloud\MyMiniCloud"

echo [1/3] Khoi dong lai c7 voi admin-api...
docker compose up -d c7
timeout /t 6 /nobreak

echo [2/3] Xoa data cu cua container ngoai project myminicloud...
docker exec c7 wget -qO- --post-data="" "http://localhost:9090/api/v1/admin/tsdb/delete_series?match[]={container_label_com_docker_compose_project!~%22myminicloud|%22}"
echo Xoa series xong.

timeout /t 2 /nobreak

echo [3/3] Don dep tombstones...
docker exec c7 wget -qO- --post-data="" "http://localhost:9090/api/v1/admin/tsdb/clean_tombstones"
echo Don dep xong!

echo.
echo Ket qua: Prometheus da sach data cu.
echo Mo lai Grafana Dashboard va nhan F5 de kiem tra.
pause
