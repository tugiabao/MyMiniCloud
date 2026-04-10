import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { MqttModule } from '../mqtt/mqtt.module';
import { AuthModule } from '../auth/auth.module';
import { SocketModule } from '../socket/socket.module';
import { System } from '../entities/system.entity';
import { Profile } from '../entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([System, Profile]),
    MqttModule,
    AuthModule,
    forwardRef(() => SocketModule), // 👈 Tránh circular dependency
  ],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService], // Export DeviceService
})
export class DeviceModule {}
