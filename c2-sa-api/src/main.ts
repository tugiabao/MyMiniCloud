import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import * as dns from 'node:dns';

async function bootstrap() {
  // 0. Ép Node.js ưu tiên IPv4 để tránh lỗi ENOTFOUND/ENETUNREACH trên một số hệ thống Docker
  dns.setDefaultResultOrder('ipv4first');

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // 1. Cấu hình Microservice MQTT (HiveMQ) - Giữ nguyên logic đang chạy tốt
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: `mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,
      username: process.env.MQTT_USER,
      password: process.env.MQTT_PASS,
      protocol: 'mqtts',
      socketOptions: {
        rejectUnauthorized: false,
      },
    },
  });

  await app.startAllMicroservices();
  logger.log('✅ MQTT Microservice đã sẵn sàng');

  // 2. CỐ ĐỊNH CẤU HÌNH CORS
  const allowedOrigins = [
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    'http://localhost:80', 
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://sa.azura.io.vn', // Production domain trên MyMiniCloud
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Nếu không có origin (mobile/curl) hoặc origin nằm trong danh sách cho phép
      if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
        callback(null, true);
      } else {
        console.error(`🚫 CORS Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // 3. Khởi chạy Server với cổng từ .env
  const port = process.env.PORT_BACKEND || 3000;
  await app.listen(port);

  logger.log(`🚀 Server Azura Backend đang chạy tại: http://localhost:${port}`);
  logger.log(`🌐 CORS đã cấu hình cho các origins: ${allowedOrigins.join(', ')}`);
}
bootstrap();
