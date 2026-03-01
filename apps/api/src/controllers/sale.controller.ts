// Sale CRUD controller — multi-tenant, automatic profit calculation
import { Request, Response, NextFunction } from 'express';
import { saleService } from '../services/sale.service';
import { sendSuccess, sendPaginated } from '../utils/helpers';

export class SaleController {
  /**
   * GET /sales — Paginated sale list with optional date range filter
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const result = await saleService.getAll({
        galleryId,
        page,
        limit,
        skip,
        startDate,
        endDate,
      });

      sendPaginated(res, result.data, result.total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /sales/stats — Sale statistics for the gallery
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const stats = await saleService.getStats(galleryId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /sales/:id — Single sale with vehicle and customer details
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const sale = await saleService.getById(id, galleryId);
      sendSuccess(res, sale);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /sales — Create a new sale (auto-calculates profit, marks vehicle SOLD)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const userId = req.user!.userId;
      const ipAddress = req.ip;

      const sale = await saleService.create(req.body, galleryId, userId, ipAddress);
      sendSuccess(res, sale, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /sales/:id — Update a sale (salePrice, notes, paymentMethod only)
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const sale = await saleService.update(id, req.body, galleryId);
      sendSuccess(res, sale);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /sales/:id/cancel — Cancel a sale (deletes sale record, returns vehicle to IN_STOCK)
   */
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const userId = req.user!.userId;
      const ipAddress = req.ip;

      const result = await saleService.cancel(id, galleryId, userId, ipAddress);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const saleController = new SaleController();
