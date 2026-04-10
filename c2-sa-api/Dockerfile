# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt pnpm toàn cục
RUN npm install -g pnpm

# Copy cả package.json và pnpm-lock.yaml (nếu có)
COPY package.json pnpm-lock.yaml* ./

# Cài đặt thư viện (dùng --no-frozen-lockfile để cho phép cài package mới)
RUN pnpm install --no-frozen-lockfile

COPY . .

# Build code TypeScript
RUN pnpm run build

# Stage 2: Run (Production)
FROM node:20-alpine

WORKDIR /app

# Vẫn cần pnpm ở stage này để chạy lệnh start
RUN npm install -g pnpm

# Copy package files để cài đặt production dependencies
COPY package.json pnpm-lock.yaml* ./

# Cài đặt chỉ dependencies cần thiết cho production
RUN pnpm install --prod --no-frozen-lockfile

# Copy mã nguồn đã build từ stage builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Chạy lệnh start từ package.json
CMD ["pnpm", "run", "start:prod"]