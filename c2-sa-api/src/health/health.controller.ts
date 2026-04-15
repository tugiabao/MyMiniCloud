import { Controller, Get } from '@nestjs/common';
import * as os from 'os';

/**
 * Health Check Controller
 * Dùng để kiểm tra trạng thái hoạt động của từng instance Backend.
 * Khi triển khai Load Balancing, endpoint này giúp xác định
 * request đang được xử lý bởi instance nào.
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      instance: os.hostname(),         // Trả về hostname (container ID) để phân biệt instance
      uptime: Math.floor(process.uptime()) + 's',
      timestamp: new Date().toISOString(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
    };
  }
}
