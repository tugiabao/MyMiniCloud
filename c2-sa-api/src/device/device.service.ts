import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MqttService } from '../mqtt/mqtt.service';
import { RegisterSystemDto } from './dto/control-device.dto';
import { System } from '../entities/system.entity';
import { Profile } from '../entities/profile.entity';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    private readonly mqttService: MqttService,
    @InjectRepository(System)
    private readonly systemRepo: Repository<System>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
  ) {}

  /**
   * 🆕 API MỚI: ĐĂNG KÝ HỆ THỐNG (HỒ CÁ) MỚI
   */
  async registerSystem(userJwt: { userId: string; email: string }, dto: RegisterSystemDto) {
    try {
      // 1. Tự động đồng bộ Keycloak Profile vào database cục bộ để gỡ lỗi khóa ngoại
      let profile = await this.profileRepo.findOne({ where: { id: dto.userId } });
      if (!profile) {
        // [QUAN TRỌNG] Xóa tài khoản cũ từ thời Supabase (bị kẹt email nhưng ID khác)
        if (userJwt.email) {
            await this.profileRepo.delete({ email: userJwt.email });
        }

        profile = this.profileRepo.create({
          id: dto.userId,
          email: userJwt.email || 'no-email@azura.io.vn',
        });
        await this.profileRepo.save(profile);
        this.logger.log(`Tự động tạo mới Profile nội bộ cho UUID: ${dto.userId}`);
      }

      // 2. Tạo hệ thống (FK an toàn vì Profile chắc chắn đã tồn tại)
      const newSystem = this.systemRepo.create({
        name: dto.systemName, // Tên định danh (VD: SA01)
        userId: dto.userId, // ID người dùng sở hữu
        isActive: true, // Mặc định kích hoạt
      });
      const savedSystem = await this.systemRepo.save(newSystem);

      return {
        message: 'Đăng ký hệ thống thành công',
        system: savedSystem,
      };
    } catch (error: any) {
      this.logger.error(`Error registerSystem: ${error.message}`);
      throw new BadRequestException(
        'Không thể đăng ký hệ thống mới. Vui lòng kiểm tra lại.',
      );
    }
  }

  /**
   * 🆕 API MỚI: HỦY ĐĂNG KÝ HỆ THỐNG
   */
  async unregisterSystem(systemName: string) {
    try {
      await this.systemRepo.delete({ name: systemName });
      return {
        message: `Hệ thống ${systemName} đã được xóa thành công`,
      };
    } catch (error: any) {
      this.logger.error(`Error unregisterSystem: ${error.message}`);
      throw new BadRequestException(
        'Không thể xóa hệ thống. Lỗi cơ sở dữ liệu.',
      );
    }
  }

  /**
   * GIỮ NGUYÊN: LẤY DANH SÁCH HỒ CÁ CỦA USER
   */
  async getMySystems(userId: string) {
    try {
      const data = await this.systemRepo.find({
        where: { userId },
        order: { createdAt: 'ASC' },
      });

      return {
        message: 'Lấy dữ liệu thành công',
        total: data.length,
        systems: data,
      };
    } catch (error: any) {
      this.logger.error(`Error getMySystems: ${error.message}`);
      throw new BadRequestException('Không thể tải danh sách hồ cá');
    }
  }

  /**
   * GIỮ NGUYÊN: XỬ LÝ ĐIỀU KHIỂN THIẾT BỊ
   */
  async controlDevice(body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { systemName, device, value, index } = body;
    this.logger.log(
      `🎮 Thực thi lệnh điều khiển cho ${systemName} -> ${device}`,
    );

    let commandPayload = {};
    switch (device) {
      case 'FEEDER':
        commandPayload = { servo: 1 };
        break;
      case 'LIGHT': {
        const lightVal = Number(value);
        if (isNaN(lightVal) || lightVal < 0 || lightVal > 255)
          throw new BadRequestException('Giá trị độ sáng phải từ 0-255');
        commandPayload = { light: lightVal };
        break;
      }
      case 'RELAY': {
        if (![1, 2, 3].includes(Number(index)))
          throw new BadRequestException('Relay index phải là 1, 2 hoặc 3');
        const relayKey = `relay${index}`;
        commandPayload = { [relayKey]: value === true || value === 1 ? 1 : 0 };
        break;
      }
      case 'PH_METER':
        commandPayload = { measure_ph: true };
        break;
      case 'CAMERA':
        commandPayload = { camera: value === true || value === 1 ? 1 : 0 };
        break;
      case 'GET_INFO':
        commandPayload = { get_info: true };
        break;
      default:
        throw new BadRequestException(`Loại thiết bị '${device}' không hợp lệ`);
    }

    const isSent = await this.mqttService.sendCommand(
      systemName,
      commandPayload,
    );
    if (!isSent)
      throw new BadRequestException('Không thể gửi lệnh (Lỗi kết nối MQTT)');

    return {
      message: 'Lệnh đã được gửi thành công',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      target: systemName,
      command: commandPayload,
    };
  }
}
