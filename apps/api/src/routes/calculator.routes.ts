import { Router } from 'express';
import { calculatorController } from '../controllers/calculator.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGalleryAccess, requireRole } from '../middleware/role.middleware';
import { galleryTenant } from '../middleware/gallery.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  calculateSchema,
  saveToVehicleSchema,
  calculationIdParamSchema,
  calculationHistoryQuerySchema,
} from '../validations/calculator.validation';

const router = Router();

// Tüm calculator endpoint'leri: kimlik doğrulama + galeri erişimi + tenant izolasyonu
router.use(authenticate, requireGalleryAccess, galleryTenant);

// POST /api/calculator/calculate — ithalat maliyet hesaplaması yap
router.post(
  '/calculate',
  validate({ body: calculateSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  calculatorController.calculate.bind(calculatorController),
);

// GET /api/calculator/rates — aktif vergi ve döviz oranlarını getir
router.get(
  '/rates',
  calculatorController.getCurrentRates.bind(calculatorController),
);

// GET /api/calculator/history — galeri bazlı hesaplama geçmişi (paginated)
router.get(
  '/history',
  validate({ query: calculationHistoryQuerySchema }),
  calculatorController.getHistory.bind(calculatorController),
);

// GET /api/calculator/:id/pdf — PDF rapor indir (/:id'den ÖNCE tanımlanmalı)
router.get(
  '/:id/pdf',
  validate({ params: calculationIdParamSchema }),
  calculatorController.generatePdf.bind(calculatorController),
);

// GET /api/calculator/:id — tek hesaplama detayı
router.get(
  '/:id',
  validate({ params: calculationIdParamSchema }),
  calculatorController.getById.bind(calculatorController),
);

// POST /api/calculator/:id/save-to-vehicle — hesaplamayı araca bağla ve maliyet alanlarını güncelle
router.post(
  '/:id/save-to-vehicle',
  validate({ params: calculationIdParamSchema, body: saveToVehicleSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  calculatorController.saveToVehicle.bind(calculatorController),
);

export default router;
