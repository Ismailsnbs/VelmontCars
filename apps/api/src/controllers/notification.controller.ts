import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { sendSuccess, sendPaginated, parsePagination } from '../utils/helpers';
import { BadRequestError } from '../middleware/error.middleware';

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export class NotificationController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query);
      // PlatformNotification model uses sentAt, not createdAt
      if (!req.query.sortBy) {
        pagination.sortBy = 'sentAt';
      }

      const rawType = req.query.type as string | undefined;
      const rawPriority = req.query.priority as string | undefined;

      const type = rawType as
        | 'TAX_CHANGE'
        | 'CURRENCY_ALERT'
        | 'GENERAL_ANNOUNCEMENT'
        | 'SYSTEM_MAINTENANCE'
        | undefined;

      const priority = rawPriority as
        | 'LOW'
        | 'NORMAL'
        | 'HIGH'
        | 'URGENT'
        | undefined;

      const { data, total } = await notificationService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        skip: pagination.skip,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder as 'asc' | 'desc',
        type,
        priority,
      });

      sendPaginated(res, data, total, pagination.page, pagination.limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const notification = await notificationService.getById(id);
      sendSuccess(res, notification);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip ? getParam(req.ip as string | string[]) : undefined;
      const notification = await notificationService.create(req.body, req.user!.userId, ip);
      sendSuccess(res, notification, 201);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const ip = req.ip ? getParam(req.ip as string | string[]) : undefined;
      await notificationService.delete(id, req.user!.userId, ip);
      sendSuccess(res, { message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getForGallery(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.user!.galleryId;
      if (!galleryId) {
        throw new BadRequestError('No gallery assigned to this user');
      }

      const pagination = parsePagination(req.query);
      if (!req.query.sortBy) {
        pagination.sortBy = 'sentAt';
      }

      const { data, total } = await notificationService.getForGallery(galleryId, {
        page: pagination.page,
        limit: pagination.limit,
        skip: pagination.skip,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder as 'asc' | 'desc',
      });

      sendPaginated(res, data, total, pagination.page, pagination.limit);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.user!.galleryId;
      if (!galleryId) {
        throw new BadRequestError('No gallery assigned to this user');
      }

      const notificationId = getParam(req.params.id);
      const read = await notificationService.markAsRead(notificationId, galleryId, req.user!.userId);
      sendSuccess(res, read);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.user!.galleryId;
      if (!galleryId) {
        throw new BadRequestError('No gallery assigned to this user');
      }

      const count = await notificationService.getUnreadCount(galleryId);
      sendSuccess(res, { unreadCount: count });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
