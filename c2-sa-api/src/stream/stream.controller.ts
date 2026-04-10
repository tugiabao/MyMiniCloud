import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { StreamService } from './stream.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemAuthGuard } from '../auth/system-auth.guard';

@Controller('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  /**
   * ✅ API BẬT STREAM (Trả về link Live và AI qua Cloudflare Tunnel)
   */
  @Post('start')
  @UseGuards(JwtAuthGuard, SystemAuthGuard)
  async startStream(@Req() req: any, @Body('systemName') systemName: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.userId;

    if (!systemName)
      throw new BadRequestException('Trường systemName là bắt buộc');

    return await this.streamService.startStream(userId, systemName);
  }

  /**
   * ✅ API TẮT STREAM
   */
  @Post('stop')
  @UseGuards(JwtAuthGuard)
  async stopStream(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return await this.streamService.stopStream(req.user.userId);
  }

  /**
   * ✅ API CHUYỂN CHẾ ĐỘ AI
   */
  @Post('mode')
  @UseGuards(JwtAuthGuard)
  async setMode(@Req() req: any, @Body('mode') mode: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = req.user.userId;
    if (!mode) throw new BadRequestException('Mode is required');
    return await this.streamService.setAiMode(userId, mode);
  }
}
