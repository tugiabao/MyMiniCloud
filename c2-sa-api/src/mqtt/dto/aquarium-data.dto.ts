import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class AquariumDataDto {
  // --- Nhóm chỉ số cảm biến ---
  @IsNumber()
  @IsOptional()
  temp?: number; // Nhiệt độ

  @IsNumber()
  @IsOptional()
  ph?: number; // Độ pH

  @IsNumber()
  @IsOptional()
  liquid?: number; // Mực nước (1 hoặc 0)

  // --- Nhóm trạng thái thiết bị ---
  @IsBoolean()
  @IsOptional()
  relay1?: boolean;

  @IsBoolean()
  @IsOptional()
  relay2?: boolean;

  @IsBoolean()
  @IsOptional()
  relay3?: boolean;

  @IsNumber()
  @IsOptional()
  light?: number; // Độ sáng

  @IsBoolean()
  @IsOptional()
  camera?: boolean;

  // --- Nhóm thời gian (Firmware mới gửi String) ---
  @IsString()
  @IsOptional()
  last_feed?: string; // Dạng "DD/MM/YYYY HH:mm:ss"

  @IsString()
  @IsOptional()
  last_ph_time?: string; // Dạng "DD/MM/YYYY HH:mm:ss"

  @IsNumber()
  @IsOptional()
  ts?: number; // Uptime

  // --- Nhóm Discovery (Nhận IP Slave/Camera) ---
  @IsString()
  @IsOptional()
  name?: string; // Tên thiết bị (VD: SA01)

  @IsString()
  @IsOptional()
  slave_ip?: string; // IP của Camera

  @IsString()
  @IsOptional()
  status?: string; // online
}
