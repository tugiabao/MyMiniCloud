import { Injectable, Logger } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';

@Injectable()
export class SocketService {
  private readonly logger = new Logger(SocketService.name);

  constructor(private readonly gateway: SocketGateway) {}

  /**
   * Phát dữ liệu cảm biến tới Room
   */
  emitSensorUpdate(systemName: string, payload: any) {
    this.logger.debug(`📤 [EMIT] sensor_update -> Room ${systemName}`);
    this.gateway.server.to(systemName).emit('sensor_update', payload);
  }

  /**
   * Phát phản hồi lệnh điều khiển (Control Feedback)
   */
  emitDeviceControl(systemName: string, payload: any) {
    this.logger.log(`📤 [EMIT] device_control -> Room ${systemName}: ${JSON.stringify(payload)}`);
    this.gateway.server.to(systemName).emit('device_control', payload);
  }

  /**
   * Thông báo cập nhật cấu hình (Schedule/Setting)
   */
  emitConfigUpdate(systemName: string, payload: any) {
    this.logger.log(`📤 [EMIT] config_update -> Room ${systemName}`);
    this.gateway.server.to(systemName).emit('config_update', payload);
  }
}
