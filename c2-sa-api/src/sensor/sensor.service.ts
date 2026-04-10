import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SensorLog } from '../entities/sensor-log.entity';
import { System } from '../entities/system.entity';
import { DeviceConfig } from '../entities/device-config.entity';
import { SocketService } from '../socket/socket.service';
import { MailService } from '../mail/mail.service';
import { Profile } from '../entities/profile.entity';
import {
  MqttSensorData,
  WebSocketSensorPayload,
  SystemAlerts,
  ReminderDetail,
} from './sensor.dto';

@Injectable()
export class SensorService {
  private readonly logger = new Logger(SensorService.name);

  // Cache thời gian lưu DB lần cuối để Throttling (Map<systemName, timestamp>)
  private lastSavedMap = new Map<string, number>();
  private readonly DB_SAVE_INTERVAL = 60 * 1000; // 60 giây

  // Theo dõi thời gian bắt đầu lỗi: Map<"systemName_device", { startTime, mailSent }>
  private alertTracking = new Map<string, { startTime: number; mailSent: boolean }>();

  constructor(
    @InjectRepository(SensorLog)
    private readonly sensorRepo: Repository<SensorLog>,
    @InjectRepository(System)
    private readonly systemRepo: Repository<System>,
    @InjectRepository(DeviceConfig)
    private readonly configRepo: Repository<DeviceConfig>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    private readonly socketService: SocketService, 
    private readonly mailService: MailService,
  ) {}

  /**
   * ENTRY POINT: Nhận dữ liệu từ MQTT Service
   */
  async processSystemData(systemName: string, data: MqttSensorData) {
    // 1. Luồng B - Real-time (Hot Data): Tính toán & Phát WebSocket
    await this.processHotData(systemName, data);

    // 2. Luồng A - Lưu trữ (Cold Data): Throttling Insert DB
    await this.processColdData(systemName, data);
  }

  // --- LOGIC HOT DATA (WebSocket) ---
  private async processHotData(systemName: string, data: MqttSensorData) {
    // a. Tính toán trạng thái Online
    const now = Date.now();
    const isOnline = Math.abs(now - data.ts) < 45000 || data.ts < 10000000000; 

    // b. Tính toán Alerts & Reminders
    const alerts = await this.calculateAlerts(systemName, data);

    // c. Tạo Payload WebSocket
    const payload: WebSocketSensorPayload = {
      systemName,
      status: {
        temp: data.temp,
        ph: data.ph,
        liquid: data.liquid,
        relays: {
          r1: data.relay1,
          r2: data.relay2,
          r3: data.relay3,
        },
        light: data.light,
        camera: data.camera,
        isOnline: true,
      },
      alerts: alerts,
      timestamp: new Date().toISOString(),
    };

    // d. Phát vào Room qua SocketService chung
    this.socketService.emitSensorUpdate(systemName, payload);
  }

  private async calculateAlerts(
    systemName: string,
    data: MqttSensorData,
  ): Promise<SystemAlerts> {
    const alerts: SystemAlerts = {
      tempAlert: null,
      phAlert: null,
      feedingReminder: this.checkTimeReminder(data.last_feed, 24, 'giờ', 'cá chưa được ăn!'),
      phReminder: this.checkTimeReminder(data.last_ph_time, 7 * 24, 'giờ', 'Lịch đo pH định kỳ'),
    };

    const thresholds = await this.configRepo.find({
      where: {
        systemName,
        device: In(['TEMP_THRESHOLD', 'PH_THRESHOLD']),
        isActive: true,
      },
    });

    for (const cfg of thresholds) {
      let isError = false;
      let errorMsg = '';
      const trackingKey = `${systemName}_${cfg.device}`;

      // Logic kiểm tra lỗi
      if (cfg.device === 'TEMP_THRESHOLD') {
        if (cfg.min !== null && data.temp < cfg.min) {
          isError = true;
          errorMsg = `Nhiệt độ thấp: ${data.temp}°C (Min: ${cfg.min})`;
        } else if (cfg.max !== null && data.temp > cfg.max) {
          isError = true;
          errorMsg = `Nhiệt độ cao: ${data.temp}°C (Max: ${cfg.max})`;
        }
        if (isError) alerts.tempAlert = errorMsg;
      }

      if (cfg.device === 'PH_THRESHOLD') {
        if (cfg.min !== null && data.ph < cfg.min) {
          isError = true;
          errorMsg = `pH thấp: ${data.ph} (Min: ${cfg.min})`;
        } else if (cfg.max !== null && data.ph > cfg.max) {
          isError = true;
          errorMsg = `pH cao: ${data.ph} (Max: ${cfg.max})`;
        }
        if (isError) alerts.phAlert = errorMsg;
      }

      // Logic Gửi Mail & Tracking
      if (isError) {
        const track = this.alertTracking.get(trackingKey);
        const now = Date.now();

        if (!track) {
          // Bắt đầu đếm giờ lỗi
          this.alertTracking.set(trackingKey, { startTime: now, mailSent: false });
        } else {
          // Đã tồn tại lỗi -> Kiểm tra thời gian
          const elapsedMinutes = (now - track.startTime) / 60000;
          const delay = cfg.alertDelay || 0; // Mặc định 0 phút

          if (elapsedMinutes >= delay && !track.mailSent) {
            // Gửi mail
            await this.sendAlertEmail(systemName, errorMsg);
            // Đánh dấu đã gửi để không spam
            this.alertTracking.set(trackingKey, { ...track, mailSent: true });
          }
        }
      } else {
        // Hết lỗi -> Xóa tracking
        if (this.alertTracking.has(trackingKey)) {
          this.alertTracking.delete(trackingKey);
          this.logger.log(`✅ [${systemName}] ${cfg.device} đã ổn định trở lại.`);
        }
      }
    }

    return alerts;
  }

  private async sendAlertEmail(systemName: string, message: string) {
    try {
      const system = await this.systemRepo.findOne({ where: { name: systemName } });
      if (!system) return;

      const profile = await this.profileRepo.findOne({ where: { id: system.userId } });
      if (!profile || !profile.email) return;

      const timeString = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

      await this.mailService.sendAlertEmail(
        profile.email,
        `🚨 [AZURA ALERT] Cảnh báo hệ thống: ${systemName}`,
        `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #d9534f;">⚠️ Phát hiện chỉ số bất thường!</h2>
          <p>Hệ thống giám sát hồ cá <strong>${systemName}</strong> vừa ghi nhận sự cố sau:</p>
          
          <div style="background-color: #fff3cd; border-left: 5px solid #ffa000; padding: 15px; margin: 15px 0;">
            <p style="font-size: 16px; font-weight: bold; margin: 0;">${message}</p>
          </div>

          <p><strong>Thời gian phát hiện:</strong> ${timeString}</p>
          <hr style="border: 1px solid #eee;" />
          <p>Vui lòng kiểm tra thiết bị ngay lập tức để đảm bảo an toàn cho sinh vật.</p>
          <p style="font-size: 12px; color: #777;">Email này được gửi tự động từ hệ thống Azura Monitor.</p>
        </div>
        `
      );
      this.logger.log(`📧 Sent alert email to ${profile.email} for ${systemName}`);
    } catch (e) {
      this.logger.error(`Failed to send alert email: ${e}`);
    }
  }

  private checkTimeReminder(
    timeStr: string,
    thresholdHours: number,
    unit: string,
    msgSuffix: string,
  ): ReminderDetail {
    const result: ReminderDetail = {
      isLate: false,
      lastTime: timeStr,
      message: '',
    };

    try {
      if (!timeStr) return result;
      const [datePart, timePart] = timeStr.split(' ');
      const [d, m, y] = datePart.split('/');
      const isoStr = `${y}-${m}-${d}T${timePart}`;
      const lastTime = new Date(isoStr).getTime();
      const now = Date.now();
      const diffHours = (now - lastTime) / (1000 * 60 * 60);

      if (diffHours > thresholdHours) {
        result.isLate = true;
        result.message = `⚠️ Đã quá ${thresholdHours} ${unit} ${msgSuffix}`;
      }
    } catch (e) {
      // Ignore parse error
    }
    return result;
  }

  // --- LOGIC COLD DATA (DB Storage) ---
  private async processColdData(systemName: string, data: MqttSensorData) {
    const now = Date.now();
    const lastSaved = this.lastSavedMap.get(systemName) || 0;

    if (now - lastSaved >= this.DB_SAVE_INTERVAL) {
      try {
        await this.sensorRepo.save({
          systemName,
          temperature: data.temp,
          ph: data.ph,
        });
        this.lastSavedMap.set(systemName, now);
        this.logger.log(`💾 Saved Cold Data for ${systemName} (Temp: ${data.temp}, pH: ${data.ph})`);
      } catch (error) {
        this.logger.error(`Failed to save cold data: ${error}`);
      }
    }
  }

  // --- CÁC HÀM API HTTP ---
  async checkSystemExists(systemName: string): Promise<boolean> {
    const count = await this.systemRepo.count({ where: { name: systemName } });
    return count > 0;
  }

  async getLatest(systemName: string) {
    const log = await this.sensorRepo.findOne({
      where: { systemName },
      order: { createdAt: 'DESC' },
    });
    return { 
        source: 'database', 
        data: log ? { ...log, connection_status: 'offline' } : null 
    };
  }

  async getHistory(systemName: string, limit: number): Promise<SensorLog[]> {
    return this.sensorRepo.find({
      where: { systemName },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getLatestDetailed(systemName: string): Promise<SensorLog> {
    const log = await this.sensorRepo.findOne({
      where: { systemName },
      order: { createdAt: 'DESC' },
    });
    if (!log) throw new NotFoundException('Not found');
    return log;
  }

  async removeLogsBySystem(systemName: string) {
    return this.sensorRepo.delete({ systemName });
  }
}