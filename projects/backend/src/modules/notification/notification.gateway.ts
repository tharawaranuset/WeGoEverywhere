import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';
import { plainToInstance } from 'class-transformer';
import { NotificationsDto } from './dto/notifications.dto';
import { Notifications } from '@backend/src/database/schema/notifications.schema';
import { AuthService } from '@backend/src/core/auth/auth.service';
import * as cookie from 'cookie';

@WebSocketGateway({
  cors: {
    origin: process.env.APP_FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE'],
    credentials: true,
  },
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private notificationService: NotificationService,
    private readonly authService: AuthService,
  ) {}

  decodeJwtToken(cookieHeader: string): { token: string; userId: number } | null {
    try {
      const parsed = cookie.parse(cookieHeader || '');
      const token = parsed['jwt'];
      if (!token) return null;

      const payload = this.authService.verifyJwtToken(token);
      if (!payload?.sub) return null;

      const userId = payload.sub;
      return { token, userId };
    } catch (err) {
      console.error('JWT decode failed:', err);
      return null;
    }
  }

  async handleConnection(client: Socket) {
    const decoded = this.decodeJwtToken(client.handshake.headers.cookie || '');
    if (!decoded?.token) {
      console.warn(`[Gateway] handleConnection invalid token for socket ${client.id}`);
      client.emit('error', 'Invalid token');
      return;
    }

    // Attach user info
    // TODO: check expired
    client.data.user = { sub: decoded.userId };
    const userId = decoded.userId;
  console.log(`[Gateway] handleConnection socket=${client.id} userId=${userId}`);

    // Send initial notification count
    this.notificationService.getNotifCount(userId)
      .then((count) => client.emit('notification_count', count))
      .catch((err) => {
        console.error('Failed to fetch notification count:', err);
        client.emit('error', 'Failed to fetch notification count');
      });
  }

  @SubscribeMessage('get_notifications')
  async handleGetNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { limit: number; offset: number }
  ) {
    const userId = client.data.user?.sub;
    if (!userId) {
      client.emit('error', 'Invalid userId');
      return;
    }
    
    console.log(`[Gateway] Connected user ${userId}`);

    this.notificationService.getNotifs(userId, payload.limit, payload.offset)
      .then((notifs) => {
        const result = plainToInstance(NotificationsDto, notifs);
        client.emit('notifications_page', result);
      })
      .catch((err) => {
        console.error('Failed to fetch notifications:', err);
        client.emit('error', 'Failed to fetch notifications');
      });
  }

  @SubscribeMessage('mark_read')
  async markRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { notificationId: number }
  ) {
    await this.notificationService.markAsRead(payload.notificationId);
    client.emit('notification_updated', { notificationId: payload.notificationId, read: true });
  }

  async broadcastNotification(
    userIds: number[],
    templateData: { title: string; fromService: string; message: string; relatedId?: number },
  ): Promise<void> {
    const userNotifications: Notifications[] =
      await this.notificationService.broadcastNotification(userIds, templateData);

    for (const notif of userNotifications) {
      // ใช้ client.data.user.sub แทน query.userId
      const sockets: Socket[] = Array.from(this.server.sockets.sockets.values())
        .filter(s => s.data.user?.sub === notif.userId);

      console.log(`[Gateway] Emitting to user ${notif.userId} sockets=${sockets.length}`, notif.id);
      sockets.forEach(s => s.emit('new_notification', {
        ...notif,
        ...(templateData.relatedId ? { relatedId: templateData.relatedId } : {}),
      }));
    }
  }
}
