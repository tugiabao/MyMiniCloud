import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceConfig } from '../entities/device-config.entity';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    @InjectRepository(DeviceConfig)
    private readonly configRepo: Repository<DeviceConfig>,
    private readonly mqttService: MqttService,
  ) {}

  /**
   * 🕒 HÀM QUÉT LỊCH TRÌNH (CRON)
   * Thực hiện kiểm tra mỗi phút để kích hoạt hoặc tắt thiết bị
   */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'automation_schedule_job' })
  async handleCron(): Promise<void> {
    const now = new Date();
    const currentTimeStr = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh',
    });

    // Chỉ lấy những lịch trình đang được kích hoạt
    const configs = await this.configRepo.find({ where: { isActive: true } });

    // Debug log (chỉ bật khi cần thiết, ở đây tôi bật để kiểm tra)
    if (configs.length > 0) {
      this.logger.debug(
        `🔍 Checking schedules at ${currentTimeStr}. Found ${configs.length} active configs.`,
      );
    }

    for (const config of configs) {
      const isMatch = config.startTime === currentTimeStr;

      // 1. Logic BẮT ĐẦU (START)
      if (isMatch) {
        this.logger.log(
          `🚀 [MATCH FOUND] Executing START for ${config.systemName} - ${config.device} (Value: ${config.value})`,
        );
        await this.triggerStartAction(config);
        // Nếu có thời lượng chạy, thiết lập hẹn giờ tắt tự động
        if (config.device !== 'servo' && config.duration > 0) {
          this.scheduleStopTimer(config);
        }
      }

      // 2. Logic TẮT DỰ PHÒNG (FAILSAFE)
      // Đảm bảo thiết bị tắt nếu lỡ qua chu kỳ setTimeout (ví dụ khi server restart)
      if (config.device !== 'servo' && config.endTime === currentTimeStr) {
        this.logger.warn(
          `🛡️ [FAILSAFE] Executing STOP for ${config.systemName} - ${config.device}`,
        );
        await this.triggerStopAction(config);
      }
    }
  }

  /**
   * Thiết lập hẹn giờ tắt dựa trên duration (phút)
   */
  private scheduleStopTimer(config: DeviceConfig): void {
    const delayInMs = Math.round(config.duration * 60 * 1000);

    setTimeout(() => {
      void this.triggerStopAction(config);
    }, delayInMs);
  }

  /**
   * Gửi lệnh bật thiết bị qua MQTT
   */
  private async triggerStartAction(config: DeviceConfig): Promise<void> {
    const sysName = config.systemName;
    this.logger.log(
      `📤 Sending MQTT START to ${sysName}/${config.device} with value ${config.value}`,
    );

    const payload = { [config.device]: config.value || 1 };
    await this.mqttService.sendCommand(sysName, payload);
  }

  /**
   * Gửi lệnh tắt thiết bị qua MQTT
   */
  private async triggerStopAction(config: DeviceConfig): Promise<void> {
    const sysName = config.systemName;
    this.logger.log(`📤 Sending MQTT STOP to ${sysName}/${config.device}`);

    const payload = { [config.device]: 0 };
    await this.mqttService.sendCommand(sysName, payload);
  }

  /**
   * API tạo lịch trình mới hoặc Cài đặt ngưỡng an toàn
   */
  async createConfig(data: Partial<DeviceConfig>): Promise<DeviceConfig> {
    if (!data.systemName || !data.device) {
      throw new BadRequestException('systemName and device are required');
    }

    // 1. Mặc định isActive là true nếu không gửi lên
    if (data.isActive === undefined) {
      data.isActive = true;
    }

    // 2. Mặc định value = 1 cho servo (máy cho ăn) nếu không gửi
    if (data.device === 'servo' && data.value === undefined) {
      data.value = 1;
    }

    // LOGIC CHO NGƯỠNG AN TOÀN: Đảm bảo duy nhất 1 ngưỡng pH và 1 ngưỡng Nhiệt độ
    if (['PH_THRESHOLD', 'TEMP_THRESHOLD'].includes(data.device)) {
      const existing = await this.configRepo.findOne({
        where: { systemName: data.systemName, device: data.device },
      });

      if (existing) {
        this.logger.log(
          `Updating existing threshold for ${data.systemName} - ${data.device}`,
        );
        // Chỉ cập nhật các trường có trong data, giữ nguyên các trường cũ khác
        Object.assign(existing, data);
        return this.configRepo.save(existing);
      }
    }

    const newConfig = this.configRepo.create(data);

    if (data.startTime && data.duration && data.duration > 0) {
      newConfig.endTime = this.calculateEndTime(data.startTime, data.duration);
    }

    this.logger.log(
      `💾 [CREATED] New config for ${data.systemName} - ${data.device}`,
    );
    return this.configRepo.save(newConfig);
  }

  /**
   * Tính toán thời gian kết thúc dựa trên giờ bắt đầu và thời lượng
   */
  public calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hour, minute] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute + Math.ceil(durationMinutes));

    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  }
}
