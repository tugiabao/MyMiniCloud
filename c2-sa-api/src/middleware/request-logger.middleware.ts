import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as os from 'os';

/**
 * Request Logger Middleware
 * Log mọi HTTP request kèm tên instance (hostname)
 * Giúp demo Load Balancing trực quan: thấy rõ request đi vào instance nào
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('LoadBalancer');
  private readonly instanceName = os.hostname().substring(0, 12); // Container ID rút gọn

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(
        `🖥️ [${this.instanceName}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
      );
    });

    next();
  }
}
