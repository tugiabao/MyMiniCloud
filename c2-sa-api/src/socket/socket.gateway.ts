import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { DeviceService } from '../device/device.service';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://sa.azura.io.vn', // Domain frontend chính xác
    ],
    credentials: true,
  },
  namespace: 'system',
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
  ) {}

  afterInit() {
    this.logger.log('✅ SocketGateway (System Namespace) Initialized');
  }

  handleConnection(client: Socket) {
    const auth = client.handshake.auth;
    
    // 🤖 AI-Core Authentication Logic
    if (auth?.type === 'ai-core') {
      const secret = process.env.AI_SERVICE_SECRET;
      
      // 1. Kiểm tra Token
      if (auth.token !== secret) {
        this.logger.error(`⛔ [AI-AUTH] Invalid Token from ${client.id}`);
        client.disconnect();
        return;
      }

      // 2. Kiểm tra System Name (Bắt buộc phải có để join đúng room)
      if (!auth.systemName) {
        this.logger.error(`⛔ [AI-AUTH] Missing systemName from ${client.id}`);
        client.disconnect();
        return;
      }

      // ✅ Xác thực thành công
      client.data.isAI = true;
      client.data.systemName = auth.systemName;
      
      // AI tự động join vào room của hệ thống để gửi lệnh
      void client.join(auth.systemName);
      
      this.logger.log(`🤖 [AI-AUTH] AI-Core authenticated & joined ${auth.systemName} (${client.id})`);
      return;
    }

    // Client thường (Frontend)
    this.logger.log(`🔌 Socket Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Socket Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() systemName: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (systemName) {
      void client.join(systemName);
      // Lấy adapter từ namespace của client hiện tại để đảm bảo chính xác
      const roomSize = client.nsp.adapter.rooms.get(systemName)?.size || 0;
      this.logger.log(`📥 [JOIN] Client ${client.id} joined room: ${systemName} (Total: ${roomSize})`);
    }
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() systemName: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (systemName) {
      void client.leave(systemName);
      const roomSize = client.nsp.adapter.rooms.get(systemName)?.size || 0;
      this.logger.log(`sw [LEAVE] Client ${client.id} left room: ${systemName} (Remaining: ${roomSize})`);
    }
  }

  /**
   * TIẾP NHẬN LỆNH ĐIỀU KHIỂN TỪ CLIENT QUA SOCKET
   */
  @SubscribeMessage('dispatch_command')
  async handleCommand(@MessageBody() payload: any, @ConnectedSocket() client: Socket) {
    this.logger.log(`📩 [COMMAND] From ${client.id}: ${JSON.stringify(payload)}`);
    try {
      // Gọi trực tiếp DeviceService để xử lý lệnh (MQTT -> Thiết bị)
      return await this.deviceService.controlDevice(payload);
    } catch (e) {
      this.logger.error(`❌ Command failed: ${e.message}`);
      return { status: 'error', message: e.message };
    }
  }
}
