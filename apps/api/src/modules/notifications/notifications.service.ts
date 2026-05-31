import { Injectable, Inject, Optional } from '@nestjs/common';
import { PrismaClient } from '@godream/database';
import { DATABASE_SERVICE } from '@/common/database/database.module';
import { NotificationType } from '@godream/database';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
    @Optional() private readonly gateway: NotificationsGateway,
  ) {}

  async create(
    userId: string,
    params: {
      type: NotificationType;
      title: string;
      body: string;
      imageUrl?: string;
      actionUrl?: string;
      data?: Record<string, any>;
    },
  ) {
    const notification = await this.db.notification.create({
      data: {
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        imageUrl: params.imageUrl,
        actionUrl: params.actionUrl,
        data: params.data ?? {},
      },
    });

    // Push real-time via WebSocket if gateway is available
    this.gateway?.sendToUser(userId, 'notification', notification);

    return notification;
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.db.notification.count({ where: { userId } }),
    ]);
    return {
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async markAllRead(userId: string) {
    return this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async markRead(userId: string, id: string) {
    return this.db.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async countUnread(userId: string) {
    return this.db.notification.count({ where: { userId, isRead: false } });
  }

  async deleteOld(userId: string) {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    return this.db.notification.deleteMany({
      where: { userId, createdAt: { lt: cutoff } },
    });
  }
}
