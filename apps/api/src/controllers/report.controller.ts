// Report Controller — gallery-scoped (multi-tenant)
// T-051: 6 rapor endpoint handler
import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { sendSuccess } from '../utils/helpers';

export class ReportController {
  // GET /api/reports/vehicle-inventory — araç envanter raporu
  async vehicleInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        res.status(400).json({ success: false, message: 'Gallery context required' });
        return;
      }
      const { status, startDate, endDate } = req.query as {
        status?: string;
        startDate?: string;
        endDate?: string;
      };

      const report = await reportService.vehicleInventoryReport(galleryId, {
        status,
        startDate,
        endDate,
      });

      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/vehicle-status — araç durum özet raporu
  async vehicleStatusSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        res.status(400).json({ success: false, message: 'Gallery context required' });
        return;
      }

      const report = await reportService.vehicleStatusSummary(galleryId);

      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/costs — maliyet raporu (ithalat hesaplamaları)
  async costReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        res.status(400).json({ success: false, message: 'Gallery context required' });
        return;
      }
      const { startDate, endDate } = req.query as {
        startDate?: string;
        endDate?: string;
      };

      const report = await reportService.costReport(galleryId, {
        startDate,
        endDate,
      });

      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/stock — ürün stok raporu
  async stockReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        res.status(400).json({ success: false, message: 'Gallery context required' });
        return;
      }

      const report = await reportService.stockReport(galleryId);

      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/sales — satış raporu
  async salesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        res.status(400).json({ success: false, message: 'Gallery context required' });
        return;
      }
      const { startDate, endDate } = req.query as {
        startDate?: string;
        endDate?: string;
      };

      const report = await reportService.salesReport(galleryId, {
        startDate,
        endDate,
      });

      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/financial-summary — finansal özet raporu (aylık kırılım)
  async financialSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        res.status(400).json({ success: false, message: 'Gallery context required' });
        return;
      }

      // Validation sonrası query'den number olarak gelir (transform uygulandı)
      const year = req.query.year as number | undefined;
      const month = req.query.month as number | undefined;

      const report = await reportService.financialSummary(galleryId, {
        year,
        month,
      });

      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
