import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class SystemAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();

    // 1. Lấy userId từ JWT (do JwtStrategy đính kèm)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = request.user?.userId;

    // 2. Lấy systemName linh hoạt từ Body, Query String hoặc Params
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const systemName = (request.body?.systemName ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.body?.system_name ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.query?.systemName ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.params?.systemName) as string;

    if (!userId) {
      throw new BadRequestException('Yêu cầu xác thực danh tính (Token)');
    }

    if (!systemName) {
      throw new BadRequestException(
        'Trường systemName là bắt buộc để xác thực quyền hệ thống',
      );
    }

    // 3. Gọi logic xác thực tập trung tại AuthService
    await this.authService.verifySystemOwnership(userId, systemName);

    return true;
  }
}
