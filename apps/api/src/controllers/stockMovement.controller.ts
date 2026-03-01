// Stock movement CRUD controller
import { Request, Response, NextFunction } from 'express';
import { stockMovementService } from '../services/stockMovement.service';
import { sendSuccess, sendPaginated, parsePagination } from '../utils/helpers';

export class StockMovementController {
  /**
   * GET /stock-movements/product/:productId - Get movements for a product (paginated)
   */
  async getByProductId(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params as { productId: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const { page, limit, skip } = parsePagination(req.query);

      const result = await stockMovementService.getByProductId({
        productId,
        galleryId,
        limit,
        skip,
      });

      sendPaginated(res, result.data, result.total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /stock-movements - Create a stock movement
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const userId = req.user!.userId;

      const result = await stockMovementService.create(req.body, galleryId, userId);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /stock-movements/:id - Delete a stock movement
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const result = await stockMovementService.delete(id, galleryId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /stock-movements/recent - Get recent movements for dashboard
   */
  async getRecent(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const movements = await stockMovementService.getRecent(galleryId, limit);
      sendSuccess(res, movements);
    } catch (error) {
      next(error);
    }
  }
}

export const stockMovementController = new StockMovementController();
