import { Module, forwardRef } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { SensorModule } from '../sensor/sensor.module';
import { StreamModule } from '../stream/stream.module';

@Module({
  imports: [
    forwardRef(() => SensorModule), // Dùng SensorService để xử lý logic cảm biến & cảnh báo
    forwardRef(() => StreamModule), // Dùng StreamService để discovery IP camera
  ],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
