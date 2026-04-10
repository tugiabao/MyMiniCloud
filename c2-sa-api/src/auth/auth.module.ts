import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { System } from '../entities/system.entity';
import { Profile } from '../entities/profile.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([System, Profile]), // Đăng ký bảng System và Profile
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, PassportModule], // Export AuthService để dùng SystemAuthGuard ở module khác
})
export class AuthModule {}
