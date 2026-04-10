import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemAuthGuard } from '../auth/system-auth.guard';
import { DeviceService } from './device.service';
import { RegisterSystemDto, ControlDeviceDto } from './dto/control-device.dto'; // Đảm bảo import DTO

@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  /**
   * 🆕 API MỚI: ĐĂNG KÝ HỆ THỐNG
   * Bảo mật: Yêu cầu JWT
   */
  @UseGuards(JwtAuthGuard)
  @Post('register')
  async register(@Req() req: any, @Body() registerSystemDto: RegisterSystemDto) {
    // req.user chứa { userId, email, roles } từ Keycloak Token
    return this.deviceService.registerSystem(req.user, registerSystemDto);
  }

  /**
   * 🆕 API MỚI: XÓA HỆ THỐNG
   * Bảo mật: Yêu cầu JWT & Quyền sở hữu hệ thống
   */
  @UseGuards(JwtAuthGuard, SystemAuthGuard)
  @Delete(':systemName')
  async unregister(@Param('systemName') systemName: string) {
    return this.deviceService.unregisterSystem(systemName);
  }

  /**
   * GIỮ NGUYÊN: API Lấy danh sách hồ cá của tôi
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-systems')
  async getMySystems(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.userId;
    return this.deviceService.getMySystems(userId);
  }

  /**
   * GIỮ NGUYÊN: API Điều khiển thiết bị
   */
  @UseGuards(JwtAuthGuard, SystemAuthGuard)
  @Post('control')
  async control(@Req() req: any, @Body() body: ControlDeviceDto) {
    try {
      return await this.deviceService.controlDevice(body);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(error.message);
    }
  }
}
