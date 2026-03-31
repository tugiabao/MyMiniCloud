FROM nginx:alpine

# Xóa cấu hình mặc định để tránh xung đột
RUN rm /etc/nginx/conf.d/default.conf

# Copy cấu hình Nginx của bạn vào thư mục template để Nginx tự động sinh file cấu hình có chứa biến môi trường .env
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]