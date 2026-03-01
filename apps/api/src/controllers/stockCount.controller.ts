// Stock Count (Inventory) Controller
import { Request, Response, NextFunction } from 'express';
import { stockCountService } from '../services/stockCount.service';
import { sendSuccess } from '../utils/helpers';

export class StockCountController {
  /**
   * GET /stock-count/products
   * Sayım başlatmak için galeri ürünlerini ve mevcut stok miktarlarını döndür.
   */
  async getProductsForCount(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const products = await stockCountService.getProductsForCount(galleryId);
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /stock-count/preview
   * Farkları hesapla ve önizle — veritabanına kaydetme.
   * Body: { items: [{ productId, countedQuantity }] }
   */
  async previewCount(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const { items } = req.body as { items: { productId: string; countedQuantity: number }[] };

      const results = await stockCountService.previewCount(items, galleryId);
      sendSuccess(res, results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /stock-count/apply
   * Sayımı onayla: farklar için ADJUSTMENT hareketleri oluştur ve stoku güncelle.
   * Body: { items: [{ productId, countedQuantity }] }
   */
  async applyCount(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const userId = req.user!.userId;
      const { items } = req.body as { items: { productId: string; countedQuantity: number }[] };

      const results = await stockCountService.applyCount(items, galleryId, userId);
      sendSuccess(res, results);
    } catch (error) {
      next(error);
    }
  }
}

export const stockCountController = new StockCountController();
