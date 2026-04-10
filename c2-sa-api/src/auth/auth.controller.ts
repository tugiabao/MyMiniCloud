import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SimpleMessageResponse, UpdateProfileDto } from './dto/profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Post('update')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() body: UpdateProfileDto,
  ): Promise<SimpleMessageResponse> {
    console.log('Update Profile Request:', req.user?.userId, body); // Debug log
    const userId = req.user?.userId;
    if (!userId)
      throw new BadRequestException('Không tìm thấy User ID trong token');
    return this.authService.updateProfile(userId, body);
  }
}
