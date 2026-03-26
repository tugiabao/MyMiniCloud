# ☁️ MyMiniCloud: Microservices Infrastructure Simulation

**MyMiniCloud** là một dự án mô phỏng hệ sinh thái điện toán đám mây thu nhỏ (Mini Cloud Platform) dựa trên công nghệ **Docker**. Mục tiêu của dự án là xây dựng một hạ tầng hoàn chỉnh gồm 9 loại dịch vụ cốt lõi, mô phỏng cách các nền tảng lớn như AWS, Azure hay GCP vận hành.

---

## 🏗 Kiến trúc tổng thể (Architecture)

Dự án được chia thành 3 nhóm chức năng chính, kết nối thông qua mạng ảo nội bộ **`cloud-net`**:

### 1. Nhóm Frontend (FE)
* **c1 (Web Server):** Triển khai giao diện người dùng (Nginx/React/Vue).

### 2. Nhóm Backend (BE) - Hệ thống xử lý trung tâm
* **c2 (Application Server):** Xử lý logic nghiệp vụ & API (Python Flask/FastAPI).
* **c3 (Database Server):** Lưu trữ dữ liệu có cấu trúc (PostgreSQL/MySQL).
* **c4 (Authentication Server):** Quản lý định danh, Token và đăng nhập (Keycloak/Custom).
* **c5 (File/Object Storage):** Lưu trữ tài nguyên tĩnh, hình ảnh, video (MinIO).

### 3. Nhóm Quản trị & Giám sát (Infra & Ops)
* **c6 (DNS / Name Service):** Điều hướng và ánh xạ tên miền nội bộ.
* **c7 (Monitoring Server):** Theo dõi hiệu năng CPU, RAM, Network (Prometheus).
* **c8 (Logging / Visualization):** Thu thập nhật ký hệ thống và trực quan hóa biểu đồ (Grafana/Loki).
* **c9 (Reverse Proxy / Load Balancer):** Cửa ngõ duy nhất tiếp nhận yêu cầu và điều phối tải (Nginx).

---

## 🚀 Các tính năng cốt lõi

* **Infrastructure as Code (IaC):** Toàn bộ 9 container được quản lý tập trung qua `docker-compose.yml`.
* **Database Migration:** Sử dụng **Alembic** để quản lý phiên bản cơ sở dữ liệu, đảm bảo tính linh hoạt và an toàn khi thay đổi schema.
* **Service Discovery:** Các dịch vụ liên lạc nội bộ qua công thức `Tên_Container:Cổng_Dịch_Vụ` nhờ mạng `cloud-net`.
* **Cloud-ception:** Mô hình "Cloud lồng Cloud" có thể triển khai mượt mà từ môi trường Local lên AWS EC2.

---

## 🛠 Hướng dẫn triển khai (Local)

### 1. Yêu cầu hệ thống
* Đã cài đặt **Docker** và **Docker Compose**.
* Đã cấu hình **Git**.
* RAM khuyến nghị: 8GB+.

### 2. Khởi chạy hệ thống
1.  Clone dự án:
    ```bash
    git clone https://github.com/tugiabao/MyMiniCloud.git
    cd MyMiniCloud
    ```
2.  Cấu hình biến môi trường:
    ```bash
    # Tạo file .env từ file mẫu và chỉnh sửa mật khẩu
    cp .env.example .env 
    ```
3.  Bật toàn bộ 9 container:
    ```bash
    docker-compose up -d
    ```

### 3. Quản lý Database Migration
Khi có sự thay đổi trong `models.py` (c2), hãy chạy các lệnh sau:
```bash
# Tạo bản migration mới
docker-compose exec c2-app alembic revision --autogenerate -m "Mô tả thay đổi"

# Cập nhật cấu trúc vào Database (c3)
docker-compose exec c2-app alembic upgrade head