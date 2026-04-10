import { Module, forwardRef } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [forwardRef(() => DeviceModule)], // 👈 Import DeviceModule để dùng DeviceService
  providers: [SocketGateway, SocketService],
  exports: [SocketService], 
})
export class SocketModule {}
