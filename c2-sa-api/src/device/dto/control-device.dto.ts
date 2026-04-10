import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// 1. DTO cho lệnh Bật/Tắt thiết bị (Relay/Camera)
export class ControlDeviceDto {
  @IsNotEmpty()
  @IsString()
  systemName: string;

  @IsNotEmpty()
  @IsIn(['RELAY', 'CAMERA', 'FEEDER', 'PH_METER', 'LIGHT', 'GET_INFO'])
  device: string;

  @IsOptional()
  value: boolean | number;

  @IsOptional()
  @IsInt()
  index?: number;
}

// 2. DTO cho lệnh chỉnh đèn
export class ControlLightDto {
  @IsNotEmpty()
  @IsString()
  systemName: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(255)
  value: number;
}

// 3. DTO cho lệnh đơn giản (Cho ăn, Đo pH) - Chỉ cần tên hệ thống
export class SystemCommandDto {
  @IsNotEmpty()
  @IsString()
  systemName: string;
}

// 4. DTO Đăng ký System
export class RegisterSystemDto {
  @IsNotEmpty()
  @IsString()
  systemName: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
  name: any;
}
