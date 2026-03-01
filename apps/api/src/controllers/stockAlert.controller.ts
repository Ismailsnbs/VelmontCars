// Stock Alert controller for low stock monitoring
import { Request, Response, NextFunction } from 'express';
import { stockAlertService } from '../services/stockAlert.service';
import { sendSuccess } from '../utils/helpers';

export class StockAlertController {
  /**
   * GET /stock-alerts/low-stock - Get all low stock products for gallery
   */
  async getLowStockProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId ?? req.user!.galleryId!;
      const lowStockProducts = await stockAlertService.getLowStockProducts(galleryId);
      sendSuccess(res, {
        data: lowStockProducts,
        total: lowStockProducts.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /stock-alerts/check - Check for low stock and create alerts
   */
  async checkAndAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId ?? req.user!.galleryId!;
      const result = await stockAlertService.checkAndAlert(galleryId);
      sendSuccess(res, {
        message: result.alerted
          ? `Alert created for ${result.count} low stock product(s)`
          : 'All products are above minimum stock levels',
        alerted: result.alerted,
        count: result.count,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const stockAlertController = new StockAlertController();
