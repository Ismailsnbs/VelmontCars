// Gallery CRUD controller
import { Request, Response, NextFunction } from 'express';
import { galleryService } from '../services/gallery.service';
import { sendSuccess, sendPaginated, parsePagination } from '../utils/helpers';

export class GalleryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip, sortBy, sortOrder } = parsePagination(req.query);
      const search = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;
      const isActive = Array.isArray(req.query.isActive) ? req.query.isActive[0] : req.query.isActive;
      const subscription = Array.isArray(req.query.subscription) ? req.query.subscription[0] : req.query.subscription;

      const result = await galleryService.getAll({
        page,
        limit,
        skip,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        search: search as string | undefined,
        isActive: isActive ? (isActive as string) === 'true' : undefined,
        subscription: subscription as string | undefined,
      });

      sendPaginated(res, result.data, result.total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const gallery = await galleryService.getById(id);
      sendSuccess(res, gallery);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const performedBy = req.user!.email;
      const ipAddress = req.ip;
      const gallery = await galleryService.create(req.body as any, performedBy, ipAddress);
      sendSuccess(res, gallery, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const performedBy = req.user!.email;
      const ipAddress = req.ip;
      const gallery = await galleryService.update(id, req.body as any, performedBy, ipAddress);
      sendSuccess(res, gallery);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const performedBy = req.user!.email;
      const ipAddress = req.ip;
      const result = await galleryService.delete(id, performedBy, ipAddress);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const stats = await galleryService.getStats(id);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const galleryController = new GalleryController();
