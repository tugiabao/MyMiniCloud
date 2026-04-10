# Stage 1: Build React App với pnpm
FROM node:20-alpine AS build

WORKDIR /app

# Cài đặt pnpm
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./

# Cài dependencies
RUN pnpm install --frozen-lockfile

COPY . .

# Nhận biến môi trường từ Docker Args
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build ra thư mục dist
RUN pnpm run build

# Stage 2: Serve with Nginx (Không đổi so với trước)
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]