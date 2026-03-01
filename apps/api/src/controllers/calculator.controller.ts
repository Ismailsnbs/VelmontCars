// Calculator controller — gallery-scoped (multi-tenant)
import { Request, Response, NextFunction } from 'express';
import { calculatorService } from '../services/calculator.service';
import { pdfService } from '../services/pdf.service';
import { sendSuccess, sendPaginated, parsePagination } from '../utils/helpers';

export class CalculatorController {
  // POST /api/calculator/calculate — ithalat maliyet hesaplaması yap
  async calculate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        res.status(400).json({ success: false, message: 'Gallery context required' });
        return;
      }

      const result = await calculatorService.calculate({
        ...req.body,
        galleryId,
        calculatedBy: req.user!.email ?? req.user!.userId,
      });

      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/calculator/rates — aktif vergi/döviz oranlarını getir
  async getCurrentRates(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rates = await calculatorService.getCurrentRates();
      sendSuccess(res, rates);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/calculator/history — galeri bazlı hesaplama geçmişi (paginated)
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const galleryId = req.galleryId;
      if (!galleryId) {
        res.status(400).json({ success: false, message: 'Gallery context required' });
        return;
      }

      const result = await calculatorService.getHistory(galleryId, { page, limit, skip });
      sendPaginated(res, result.data as object[], result.total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/calculator/:id — tek hesaplama detayı
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        res.status(400).json({ success: false, message: 'Gallery context required' });
        return;
      }

      const calculation = await calculatorService.getById(id, galleryId);
      sendSuccess(res, calculation);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/calculator/:id/pdf — hesaplama PDF raporu indir
  async generatePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        res.status(400).json({ success: false, message: 'Gallery context required' });
        return;
      }

      const calculation = await calculatorService.getById(id, galleryId);

      const pdfDoc = pdfService.generateCalculationPdf(calculation);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="calculation-${id}.pdf"`,
      );

      pdfDoc.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/calculator/:id/save-to-vehicle — hesaplamayı araca bağla
  async saveToVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { vehicleId } = req.body as { vehicleId: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        res.status(400).json({ success: false, message: 'Gallery context required' });
        return;
      }

      const performedBy = req.user!.email ?? req.user!.userId;
      const ipAddress = req.ip;

      await calculatorService.saveToVehicle(id, vehicleId, galleryId, performedBy, ipAddress);
      sendSuccess(res, { message: 'Calculation saved to vehicle successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const calculatorController = new CalculatorController();
