import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DeviceConfig } from '../entities/device-config.entity';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { MqttModule } from '../mqtt/mqtt.module';
import { AuthModule } from '../auth/auth.module'; // 👈 Tích hợp module bảo mật tập trung

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceConfig]),
    ScheduleModule.forRoot(),
    MqttModule,
    AuthModule, // 👈 Cho phép sử dụng JwtAuthGuard và SystemAuthGuard
  ],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
