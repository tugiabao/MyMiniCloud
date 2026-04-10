import {
  Injectable,
  OnModuleInit,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import * as mqtt from 'mqtt';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AquariumDataDto } from './dto/aquarium-data.dto';
import { SensorService } from '../sensor/sensor.service';
import { StreamService } from '../stream/stream.service';
import { MqttSensorData } from '../sensor/sensor.dto'; // 👈 Import đúng vị trí

@Injectable()
export class MqttService implements OnModuleInit {
  private mqttClient: mqtt.MqttClient;
  private readonly logger = new Logger(MqttService.name);
  private readonly TOPIC_SUBSCRIBE_PATTERN = 'aquarium/+/data';

  constructor(
    @Inject(forwardRef(() => SensorService))
    private readonly sensorService: SensorService,
    @Inject(forwardRef(() => StreamService))
    private readonly streamService: StreamService, // Kết nối để xử lý IP Discovery
  ) {}

  onModuleInit() {
    this.connectToBroker();
  }

  private connectToBroker() {
    const host = process.env.MQTT_HOST || 'localhost';
    const port = process.env.MQTT_PORT || '1883';
    const user = process.env.MQTT_USER || '';
    const pass = process.env.MQTT_PASS || '';

    const connectUrl = `mqtts://${host}:${port}`;
    const clientId = `be_core_${Math.random().toString(16).slice(2, 8)}`;

    this.logger.log(`🔌 Kết nối tới MQTT Broker tại ${host}...`);

    this.mqttClient = mqtt.connect(connectUrl, {
      clientId,
      username: user,
      password: pass,
      reconnectPeriod: 5000,
      rejectUnauthorized: false,
    });

    this.mqttClient.on('connect', () => {
      this.logger.log('✅ MQTT đã kết nối thành công!');
      this.mqttClient.subscribe(this.TOPIC_SUBSCRIBE_PATTERN, (err) => {
        if (!err) {
          this.logger.log(
            `📡 Đang lắng nghe trên topic: ${this.TOPIC_SUBSCRIBE_PATTERN}`,
          );
        }
      });
    });

    this.mqttClient.on('message', (topic, message) => {
      void this.handleIncomingMessage(topic, message.toString());
    });

    this.mqttClient.on('error', (err) => {
      this.logger.error(`❌ Lỗi MQTT: ${err.message}`);
    });
  }

  /**
   * PHẦN 1: XỬ LÝ DỮ LIỆU ĐẾN
   */
  private async handleIncomingMessage(topic: string, payload: string) {
    try {
      const parts = topic.split('/');
      if (parts.length !== 3 || parts[2] !== 'data') return;
      const systemName = parts[1];

      // 1. Kiểm tra tính danh hệ thống
      const isValid = await this.sensorService.checkSystemExists(systemName);
      if (!isValid) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const rawData = JSON.parse(payload);

      // 2. Xử lý IP Discovery (Trách nhiệm của StreamModule)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (rawData.slave_ip) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        this.streamService.handleIpResponse(systemName, rawData.slave_ip);
        return;
      }

      // 3. Validate dữ liệu cảm biến
      const dto = plainToInstance(AquariumDataDto, rawData);
      const errors = await validate(dto);
      if (errors.length > 0) {
        this.logger.warn(`Dữ liệu không hợp lệ từ ${systemName}`);
        return;
      }

      // 4. Chuyển sang SensorService xử lý tập trung
      // Map DTO (Optional) -> Interface (Required) với giá trị mặc định
      const sensorData: MqttSensorData = {
        temp: dto.temp ?? 0,
        ph: dto.ph ?? 0,
        liquid: dto.liquid ?? 1, // Mặc định là ĐỦ nước để tránh báo động giả
        relay1: dto.relay1 ?? false,
        relay2: dto.relay2 ?? false,
        relay3: dto.relay3 ?? false,
        light: dto.light ?? 0,
        camera: dto.camera ?? false,
        last_feed: dto.last_feed || '',
        last_ph_time: dto.last_ph_time || '',
        ts: dto.ts ?? Date.now(),
      };

      await this.sensorService.processSystemData(systemName, sensorData);
    } catch (error) {
      this.logger.error(`MQTT Handle Error: ${error}`);
    }
  }

  /**
   * PHẦN 2: CÁC HÀM GỬI LỆNH (Gửi tới aquarium/SA01/command)
   */
  async sendCommand(systemName: string, commandPayload: any): Promise<boolean> {
    if (!this.mqttClient || !this.mqttClient.connected) {
      this.logger.warn('⚠️ MQTT chưa kết nối, không thể gửi lệnh');
      return false;
    }

    const topic = `aquarium/${systemName}/command`;
    const message = JSON.stringify(commandPayload);

    return new Promise((resolve) => {
      this.mqttClient.publish(topic, message, (err) => {
        if (err) {
          this.logger.error(`❌ Gửi lệnh thất bại: ${err.message}`);
          resolve(false);
        } else {
          this.logger.log(`📤 Đã gửi lệnh tới [${systemName}]: ${message}`);
          resolve(true);
        }
      });
    });
  }

  // Các hàm điều khiển thiết bị
  async toggleDevice(
    systemName: string,
    device: 'relay1' | 'relay2' | 'relay3' | 'camera',
    status: boolean,
  ) {
    return this.sendCommand(systemName, { [device]: status ? 1 : 0 });
  }

  async feedFish(systemName: string) {
    return this.sendCommand(systemName, { servo: 1 });
  }
}