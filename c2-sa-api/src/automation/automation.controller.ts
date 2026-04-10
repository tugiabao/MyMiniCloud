import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Patch,
  UseGuards, //
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { DeviceConfig } from '../entities/device-config.entity';
import { AutomationService } from './automation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; //
import { SystemAuthGuard } from '../auth/system-auth.guard'; //

@Controller('schedule')
export class AutomationController {
  constructor(
    @InjectRepository(DeviceConfig)
    private readonly configRepo: Repository<DeviceConfig>,
    private readonly automationService: AutomationService,
  ) {}

  /**
   * Lấy danh sách lịch trình
   * Bảo mật: Chỉ yêu cầu đăng nhập JWT
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(): Promise<DeviceConfig[]> {
    return this.configRepo.find({ order: { startTime: 'ASC' } });
  }

  /**
   * Tạo lịch trình mới
   * Bảo mật: 2 lớp (Đăng nhập + Đúng chủ sở hữu hệ thống trong Body)
   */
  @UseGuards(JwtAuthGuard, SystemAuthGuard)
  @Post()
  async create(@Body() body: Partial<DeviceConfig>): Promise<DeviceConfig> {
    return this.automationService.createConfig(body);
  }

  /**
   * Xóa lịch trình
   * Bảo mật: JWT (Cần cân nhắc thêm logic check quyền sở hữu tại Service trước khi xóa)
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<DeleteResult> {
    return this.configRepo.delete(id);
  }

  /**
   * Bật/Tắt lịch trình
   * Bảo mật: 2 lớp.
   * Yêu cầu Body: { "isActive": boolean, "systemName": "SA01" }
   */
  @UseGuards(JwtAuthGuard, SystemAuthGuard)
  @Patch(':id/toggle')
  async toggle(
    @Param('id') id: number,
    @Body('isActive') isActive: boolean, // 👈 Cần thiết cho SystemAuthGuard
  ): Promise<{ success: boolean }> {
    await this.configRepo.update(id, { isActive });
    return { success: true };
  }
}
