import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs'; // 👈 Đã loại bỏ Subject (SSE cảm biến chuyển sang SensorService)
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);

  // Lấy URL BE phụ từ .env (Ví dụ: http://ai-core:5000)
  private get aiServiceUrl() {
    const url = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  // Quản lý việc chờ phản hồi IP từ MQTT
  private ipResolverMap = new Map<string, (ip: string) => void>();

  constructor(
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => MqttService))
    private readonly mqttService: MqttService,
  ) {}

  /**
   * 📡 LẤY IP CAMERA QUA MQTT DISCOVERY
   */
  async getCameraIp(systemName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.ipResolverMap.set(systemName, resolve);
      this.mqttService.sendCommand(systemName, { get_info: true });
      this.logger.log(
        `📡 Đang gửi yêu cầu lấy IP từ hệ thống ${systemName}...`,
      );

      setTimeout(() => {
        if (this.ipResolverMap.has(systemName)) {
          this.ipResolverMap.delete(systemName);
          reject(
            new HttpException(
              `Thiết bị ${systemName} không phản hồi IP qua mạng nội bộ`,
              HttpStatus.BAD_REQUEST, // Sửa để tránh Cloudflare chặn 504
            ),
          );
        }
      }, 5000);
    });
  }

  /**
   * XỬ LÝ PHẢN HỒI IP TỪ MQTT SERVICE
   */
  handleIpResponse(systemName: string, slaveIp: string) {
    const resolver = this.ipResolverMap.get(systemName);
    if (resolver && slaveIp && slaveIp !== '0.0.0.0') {
      this.logger.log(`📍 Đã nhận IP nội bộ cho ${systemName}: ${slaveIp}`);
      resolver(slaveIp);
      this.ipResolverMap.delete(systemName);
    }
  }

  /**
   * 🎬 KÍCH HOẠT LUỒNG STREAM (Live & AI)
   */
  async startStream(userId: string, systemName: string) {
    try {
      // 1. Lấy IP CAM nội bộ thông qua máy tính biên (Edge Gateway)
      const camIp = await this.getCameraIp(systemName);
      const localUrl = `http://${camIp}/stream`;

      // 2. Kích hoạt phiên làm việc tại BE phụ (AI Service)
      this.logger.log(`🎬 Yêu cầu BE phụ kết nối tới nguồn Local: ${localUrl}`);
      await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/start-live`, {
          user_id: userId,
          stream_url: localUrl,
          systemName: systemName,
          secret: process.env.AI_SERVICE_SECRET,
        }),
      );

      // 3. Trả về 2 link công khai khớp với cấu hình Cloudflare Tunnel
      return {
        status: 'success',
        systemName,
        liveStreamUrl: `${process.env.LIVE_DOMAIN}/video/live?user_id=${userId}`,
        aiUrl: `${process.env.AI_DOMAIN}/video/ai?user_id=${userId}`,
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const errorMsg = error.response?.data?.detail || error.message;
      this.logger.error(`❌ Lỗi hệ thống Stream: ${errorMsg}`);
      throw new HttpException(
        'Không thể khởi động luồng video. Thiết bị chưa SS hoặc BE AI lỗi.',
        HttpStatus.BAD_REQUEST, // Sửa để tránh Cloudflare chặn 502
      );
    }
  }

  /**
   * 🛑 DỪNG LUỒNG STREAM
   */
  async stopStream(userId: string) {
    const url = `${this.aiServiceUrl}/stop-live`;
    try {
      await firstValueFrom(
        this.httpService.post(url, { user_id: userId, stream_url: '' }),
      );
      this.logger.log(`🛑 Đã giải phóng tài nguyên stream cho User: ${userId}`);
      return { status: 'success' };
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`❌ Lỗi khi dừng luồng: ${e.message}`);
      return { status: 'error' };
    }
  }

  /**
   * 🔄 CHUYỂN CHẾ ĐỘ AI
   */
  async setAiMode(userId: string, mode: string) {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/set-mode`, {
          user_id: userId,
          mode: mode,
        }),
      );
      this.logger.log(`🔄 User ${userId} switched to mode: ${mode}`);
      return { status: 'success' };
    } catch (e) {
      this.logger.error(`❌ Lỗi khi chuyển mode: ${e.message}`);
      return { status: 'error' };
    }
  }
}
