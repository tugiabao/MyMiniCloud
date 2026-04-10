import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SimpleMessageResponse, UpdateProfileDto } from './dto/profile.dto';
import { System } from '../entities/system.entity';
import { Profile } from '../entities/profile.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(System)
    private readonly systemRepo: Repository<System>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
  ) {}

  /**
   * 🔐 Kiểm tra quyền sở hữu hệ thống
   */
  async verifySystemOwnership(
    userId: string,
    systemName: string,
  ): Promise<void> {
    const system = await this.systemRepo.findOne({
      where: {
        name: systemName,
        userId: userId,
        isActive: true,
      },
    });

    if (!system) {
      throw new ForbiddenException(
        `Truy cập bị từ chối: Bạn không có quyền điều khiển hệ thống ${systemName}`,
      );
    }
  }

  /**
   * CẬP NHẬT THÔNG TIN CÁ NHÂN (Local Database)
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
  ): Promise<SimpleMessageResponse> {
    // Chỉ cập nhật bảng profiles trong DB (Hệ thống Keycloak sẽ do user tự đổi trong SSO)
    const existingProfile = await this.profileRepo.findOne({
      where: { id: userId },
    });

    if (existingProfile) {
      await this.profileRepo.update(userId, {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        gender: data.gender,
        birthday: data.birthday,
      });
    } else {
      await this.profileRepo.save({
        id: userId,
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        gender: data.gender,
        birthday: data.birthday,
      });
    }

    return { message: 'Cập nhật thông tin thành công' };
  }
}
