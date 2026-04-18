# ☁️ MyMiniCloud: Private Microservices Infrastructure

**MyMiniCloud** là một dự án nghiên cứu và triển khai hệ sinh thái điện toán đám mây riêng biệt (Private Cloud Platform) dựa trên kiến trúc **Microservices** và công nghệ **Docker**. Dự án đóng vai trò là hạ tầng xương sống mạnh mẽ để vận hành ứng dụng lõi **Smart Aquarium (SA)** - hệ thống quản lý bể cá thông minh tích hợp IoT và AI.

Hệ thống được thiết kế theo tiêu chuẩn công nghiệp với khả năng định tuyến nội bộ, cân bằng tải, bảo mật định danh tập trung (SSO) và quan trắc hệ thống theo thời gian thực (Real-time Observability). Hiện tại, dự án đang được triển khai thực tế trên nền tảng **Oracle Cloud Infrastructure (ARM 4-Core, 24GB RAM)**.

---

## 🏗 Kiến trúc Tổng thể (Architecture)

Hệ thống bao gồm 13+ dịch vụ (Containers) được đóng gói và vận hành hoàn toàn độc lập, giao tiếp với nhau qua mạng ảo nội bộ `cloud-net`:

### 🖥 Lớp Giao diện & Ứng dụng (Frontend & Backend)
* **c1-blog:** Trang báo cáo và tài liệu dự án tĩnh (HTML/CSS/JS thuần).
* **c1-sa-web:** Giao diện người dùng Web App cho Smart Aquarium (ReactJS + Vite + TypeScript).
* **c2-sa-api (x3 Nodes):** Cụm máy chủ xử lý logic nghiệp vụ và tương tác phần cứng IoT (NestJS + TypeScript). Được cấu hình Cân bằng tải (Load Balancing) thành 3 instance trên môi trường Production.

### 💾 Lớp Dữ liệu & Lưu trữ (Data Layer)
* **c3 (PostgreSQL):** Cơ sở dữ liệu quan hệ lưu trữ dữ liệu nghiệp vụ và thông tin người dùng.
* **c3-dbview (CloudBeaver):** Giao diện quản trị Database trực quan trên nền Web.
* **c5 (MinIO):** Kho lưu trữ đối tượng phi cấu trúc (Object Storage) tương thích chuẩn S3, chuyên lưu trữ hình ảnh/video từ camera bể cá.

### 🔐 Lớp Mạng & Bảo mật (Networking & Security)
* **c4 (Keycloak):** Máy chủ định danh tập trung, quản lý bảo mật OAuth2/OIDC và cấp phát Access Token (JWT).
* **c6 (BIND9 DNS):** Máy chủ phân giải tên miền nội bộ (Local DNS), giúp các container giao tiếp qua định danh thay vì IP thô.
* **c9 (Nginx Proxy):** Cửa ngõ Reverse Proxy trung tâm tiếp nhận yêu cầu, phân giải SSL nội bộ và điều hướng luồng dữ liệu.
* **c10 (Cloudflare Tunnel):** Đường hầm bảo mật Zero-trust mã hóa lưu lượng từ ngoài Internet vào thẳng hệ thống không cần mở cổng.

### 📈 Lớp Giám sát Hệ thống (Observability)
* **c7 (Prometheus):** Máy chủ cào và lưu trữ dữ liệu chuỗi thời gian (Time-series DB).
* **c8 (Grafana):** Bảng điều khiển trực quan hóa biểu đồ theo dõi hiệu năng.
* **cadvisor:** Đặc vụ giám sát tài nguyên (CPU, RAM, Disk) ở cấp độ container.

---

## 🚀 Các Tính năng Kỹ thuật Cốt lõi

1. **Multi-stage Build:** Tối ưu hóa kích thước Docker Image (Giảm từ hàng GB xuống vài chục MB cho Frontend).
2. **Dynamic Configuration:** Tách biệt cấu hình môi trường qua file `.env`, giúp dễ dàng di chuyển giữa Local và Cloud.
3. **Internal Service Discovery:** Giao tiếp nội container hoàn toàn bằng tên miền `.myminicloud.local` qua Local DNS.
4. **Zero-Downtime Scaling:** Khả năng nhân bản (Scale) Backend API thành nhiều Node thông qua `docker-compose.override.yml`.

---

## 🛠 Hướng dẫn Khởi chạy Hệ thống

### Yêu cầu Hệ thống
* Đã cài đặt **Docker** và **Docker Compose**.
* Khuyến nghị: RAM tối thiểu 8GB (Môi trường Local) hoặc chạy trên Server mạnh.

### Quy trình Khởi tạo
1. **Clone dự án:**
    ```bash
    git clone https://github.com/tugiabao/MyMiniCloud.git
    cd MyMiniCloud
    ```
2. **Cấu hình biến môi trường:**
    ```bash
    # Sao chép file cấu hình mẫu và điền các mật khẩu/IP cần thiết
    cp .env.example .env 
    ```
3. **Cấp quyền cho thư mục dữ liệu (Dành cho Linux/Server):**
    ```bash
    mkdir -p ./c7-monitor/data ./c8-logging/data
    sudo chmod -R 777 ./c7-monitor/data ./c8-logging/data
    ```
4. **Khởi chạy hệ thống:**
    ```bash
    # Dưới máy Local
    docker compose up -d --build
    
    # Trên môi trường Cloud (Oracle) có cấu hình Override
    docker compose -f docker-compose.yml -f docker-compose.override.yml up -d --build
    ```

---

## 🌐 Liên kết Dự án

* 📖 **Trang Blog Giới thiệu:** [https://blog.azura.io.vn](https://blog.azura.io.vn)
* 🐳 **Docker Hub:** [baobao04](https://hub.docker.com/u/baobao04)

---
*Dự án đồ án sinh viên - Quản trị hệ thống & Điện toán đám mây.*