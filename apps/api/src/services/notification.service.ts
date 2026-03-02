import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { auditService } from './audit.service';
import { NotFoundError, ForbiddenError } from '../middleware/error.middleware';
import { emitToGallery } from '../socket';
import { SOCKET_EVENTS } from '../socket/events';

interface GetAllNotificationParams {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  type?: 'TAX_CHANGE' | 'CURRENCY_ALERT' | 'GENERAL_ANNOUNCEMENT' | 'SYSTEM_MAINTENANCE';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

interface CreateNotificationData {
  type: 'TAX_CHANGE' | 'CURRENCY_ALERT' | 'GENERAL_ANNOUNCEMENT' | 'SYSTEM_MAINTENANCE';
  title: string;
  message: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  targetType: string;
  targetIds: string[];
}

interface GetForGalleryParams {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export class NotificationService {
  async getAll(params: GetAllNotificationParams) {
    const where: Prisma.PlatformNotificationWhereInput = {};

    if (params.type) {
      where.type = params.type;
    }

    if (params.priority) {
      where.priority = params.priority;
    }

    const [data, total] = await Promise.all([
      prisma.platformNotification.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
        include: {
          _count: { select: { reads: true } },
        },
      }),
      prisma.platformNotification.count({ where }),
    ]);

    return { data, total };
  }

  async getById(id: string) {
    const notification = await prisma.platformNotification.findUnique({
      where: { id },
      include: {
        _count: { select: { reads: true } },
        reads: {
          orderBy: { readAt: 'desc' },
        },
      },
    });

    if (!notification) throw new NotFoundError('Notification not found');

    return notification;
  }

  async create(data: CreateNotificationData, userId: string, ip?: string) {
    const notification = await prisma.platformNotification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority ?? 'NORMAL',
        targetType: data.targetType,
        targetIds: data.targetIds,
        sentBy: userId,
      },
    });

    await auditService.log({
      action: 'CREATE',
      entityType: 'PlatformNotification',
      entityId: notification.id,
      newValues: data,
      performedBy: userId,
      ipAddress: ip,
    });

    // Socket emit — galeri panellerine bildirim gönder
    try {
      const payload = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
      };

      if (data.targetType === 'ALL') {
        const galleries = await prisma.gallery.findMany({
          where: { isActive: true },
          select: { id: true },
        });
        for (const gallery of galleries) {
          emitToGallery(gallery.id, SOCKET_EVENTS.NOTIFICATION_NEW, payload);
        }
      } else if (data.targetType === 'GALLERY') {
        for (const galleryId of data.targetIds) {
          emitToGallery(galleryId, SOCKET_EVENTS.NOTIFICATION_NEW, payload);
        }
      }
    } catch {
      // Socket hatası HTTP response'u bozmasın
    }

    return notification;
  }

  async delete(id: string, userId: string, ip?: string) {
    const existing = await prisma.platformNotification.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Notification not found');

    await prisma.platformNotification.delete({ where: { id } });

    await auditService.log({
      action: 'DELETE',
      entityType: 'PlatformNotification',
      entityId: id,
      oldValues: existing,
      performedBy: userId,
      ipAddress: ip,
    });
  }

  async getForGallery(galleryId: string, params: GetForGalleryParams) {
    const where: Prisma.PlatformNotificationWhereInput = {
      OR: [
        { targetType: 'ALL' },
        {
          targetType: 'GALLERY',
          targetIds: { has: galleryId },
        },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.platformNotification.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
        include: {
          reads: {
            where: { galleryId },
            select: { readAt: true, readBy: true },
          },
        },
      }),
      prisma.platformNotification.count({ where }),
    ]);

    return { data, total };
  }

  async markAsRead(notificationId: string, galleryId: string, userId: string) {
    const notification = await prisma.platformNotification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundError('Notification not found');

    // Verify the notification targets the calling gallery
    const isTargeted =
      notification.targetType === 'ALL' ||
      (notification.targetIds as string[]).includes(galleryId);

    if (!isTargeted) {
      throw new ForbiddenError('This notification is not targeted at your gallery');
    }

    const read = await prisma.notificationRead.upsert({
      where: {
        notificationId_galleryId: { notificationId, galleryId },
      },
      create: {
        notificationId,
        galleryId,
        readBy: userId,
      },
      update: {
        readAt: new Date(),
        readBy: userId,
      },
    });

    return read;
  }

  async getUnreadCount(galleryId: string): Promise<number> {
    const targeted = await prisma.platformNotification.count({
      where: {
        OR: [
          { targetType: 'ALL' },
          {
            targetType: 'GALLERY',
            targetIds: { has: galleryId },
          },
        ],
      },
    });

    const readCount = await prisma.notificationRead.count({
      where: {
        galleryId,
        notification: {
          OR: [
            { targetType: 'ALL' },
            {
              targetType: 'GALLERY',
              targetIds: { has: galleryId },
            },
          ],
        },
      },
    });

    return Math.max(0, targeted - readCount);
  }
}

export const notificationService = new NotificationService();
