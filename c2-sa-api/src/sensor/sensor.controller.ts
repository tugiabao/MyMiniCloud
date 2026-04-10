import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { SensorService } from './sensor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemAuthGuard } from '../auth/system-auth.guard';

@Controller('sensor')
export class SensorController {
  constructor(private readonly sensorService: SensorService) {}

  // 🗑️ Đã loại bỏ SSE Endpoint (/sensor/events)
  // Dashboard sẽ kết nối qua WebSocket (Socket.io) namespace '/sensor'

  @Post('status')
  @UseGuards(JwtAuthGuard, SystemAuthGuard)
  async getSystemStatus(@Body('systemName') systemName: string) {
    if (!systemName)
      throw new BadRequestException('Trường systemName là bắt buộc');
    return this.sensorService.getLatest(systemName);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, SystemAuthGuard)
  async getHistory(
    @Query('systemName') systemName: string,
    @Query('limit') limit = '20',
  ) {
    if (!systemName)
      throw new BadRequestException('systemName query là bắt buộc');
    return this.sensorService.getHistory(systemName, parseInt(limit, 10));
  }

  @Get('info/:systemName')
  @UseGuards(JwtAuthGuard, SystemAuthGuard)
  findOneBySystem(@Param('systemName') systemName: string) {
    return this.sensorService.getLatestDetailed(systemName);
  }

  @Delete(':systemName')
  @UseGuards(JwtAuthGuard, SystemAuthGuard)
  removeBySystem(@Param('systemName') systemName: string) {
    return this.sensorService.removeLogsBySystem(systemName);
  }
}