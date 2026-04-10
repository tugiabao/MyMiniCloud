import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // Hoặc config từ .env
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendAlertEmail(to: string, subject: string, content: string) {
    if (!to) return;
    try {
      await this.transporter.sendMail({
        from: '"Azura IoT System" <no-reply@azura.com>',
        to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #e11d48;">⚠️ CẢNH BÁO HỆ THỐNG</h2>
            <p>${content}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">Đây là email tự động từ hệ thống giám sát Azura IoT.</p>
          </div>
        `,
      });
      this.logger.log(`📧 Đã gửi mail cảnh báo tới: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Lỗi gửi mail: ${error}`);
    }
  }

  async sendVerificationEmail(to: string, link: string) {
    if (!to) return;
    try {
      await this.transporter.sendMail({
        from: '"Azura IoT System" <no-reply@azura.com>',
        to,
        subject: 'Xác thực tài khoản Azura IoT',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0ea5e9; text-align: center;">Chào mừng đến với Azura IoT!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn vào nút bên dưới để xác thực email của bạn:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Xác thực ngay</a>
            </div>
            <p>Hoặc truy cập link sau: <a href="${link}">${link}</a></p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666; text-align: center;">Email này được gửi tự động. Vui lòng không trả lời.</p>
          </div>
        `,
      });
      this.logger.log(`📧 Đã gửi mail xác thực tới: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Lỗi gửi mail xác thực: ${error}`);
    }
  }
}
