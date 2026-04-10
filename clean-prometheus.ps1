# Script xoa data cu Prometheus
$match = '{container_label_com_docker_compose_project!~"myminicloud|"}'
$encoded = [System.Uri]::EscapeDataString($match)
$url1 = "http://localhost:9090/api/v1/admin/tsdb/delete_series?match[]=$encoded"
$url2 = "http://localhost:9090/api/v1/admin/tsdb/clean_tombstones"

Write-Host "[1] Xoa series ngoai project myminicloud..." -ForegroundColor Yellow
$r1 = docker exec c7 wget -qO- --post-data="" $url1 2>&1
Write-Host "Ket qua: $r1"

Write-Host "[2] Don dep tombstones..." -ForegroundColor Yellow
$r2 = docker exec c7 wget -qO- --post-data="" $url2 2>&1
Write-Host "Ket qua: $r2"

Write-Host "Hoan thanh! Mo Grafana va F5 de kiem tra." -ForegroundColor Green
