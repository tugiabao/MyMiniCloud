import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorService } from './sensor.service';
import { SensorController } from './sensor.controller';
import { SensorLog } from '../entities/sensor-log.entity';
import { System } from '../entities/system.entity';
import { DeviceConfig } from '../entities/device-config.entity';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { SocketModule } from '../socket/socket.module'; // 👈 Import SocketModule
import { Profile } from '../entities/profile.entity'; // 👈 Import Profile

@Module({
  imports: [
    TypeOrmModule.forFeature([SensorLog, System, DeviceConfig, Profile]), // 👈 Thêm Profile vào đây
    AuthModule,
    MailModule,
    SocketModule, 
  ],
  controllers: [SensorController],
  providers: [SensorService], // 👈 Loại bỏ SensorGateway
  exports: [SensorService],
})
export class SensorModule {}
