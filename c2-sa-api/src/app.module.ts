import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceConfig } from './entities/device-config.entity';
import { System } from './entities/system.entity';
import { SensorLog } from './entities/sensor-log.entity';
import { Profile } from './entities/profile.entity';
import { DeviceModule } from './device/device.module';
import { SensorModule } from './sensor/sensor.module';
import { StreamModule } from './stream/stream.module';
import { MqttModule } from './mqtt/mqtt.module';
import { AutomationModule } from './automation/automation.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    // 1. Cấu hình biến môi trường (Load .env)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),

    // 2. Kết nối Database (PostgreSQL nội bộ)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [DeviceConfig, SensorLog, System, Profile],
      synchronize: true, // Tự động tạo bảng (Chỉ dùng cho Dev)
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }),

    // 3. Các Feature Modules
    DeviceModule,
    SensorModule,
    StreamModule,
    MqttModule,
    AutomationModule,
    AuthModule,
    MailModule,
    SocketModule,
  ],
})
export class AppModule {}
