// Report routes — gallery-scoped (multi-tenant)
// T-051: 6 rapor endpoint
import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGalleryAccess, requireFinanceAccess, requireRole } from '../middleware/role.middleware';
import { galleryTenant } from '../middleware/gallery.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  reportFilterSchema,
  financialFilterSchema,
} from '../validations/report.validation';

const router = Router();

// Tüm rapor endpoint'leri: kimlik doğrulama + galeri erişimi + tenant izolasyonu + rapor yetkisi
// STAFF erişemez (rol matrisine göre ACCOUNTANT ve üstü)
router.use(authenticate, requireGalleryAccess, requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES', 'ACCOUNTANT'), galleryTenant);

// GET /api/reports/vehicle-inventory — tüm araçlar detaylı envanter (filtreli)
router.get(
  '/vehicle-inventory',
  validate({ query: reportFilterSchema }),
  reportController.vehicleInventory.bind(reportController),
);

// GET /api/reports/vehicle-status — durum bazlı araç özeti
router.get(
  '/vehicle-status',
  reportController.vehicleStatusSummary.bind(reportController),
);

// GET /api/reports/costs — ithalat hesaplama maliyet raporu (filtreli)
router.get(
  '/costs',
  validate({ query: reportFilterSchema }),
  reportController.costReport.bind(reportController),
);

// GET /api/reports/stock — ürün stok durumu raporu
router.get(
  '/stock',
  reportController.stockReport.bind(reportController),
);

// GET /api/reports/sales — satış raporu (filtreli)
router.get(
  '/sales',
  validate({ query: reportFilterSchema }),
  reportController.salesReport.bind(reportController),
);

// GET /api/reports/financial-summary — finansal özet, aylık kırılım (filtreli)
router.get(
  '/financial-summary',
  validate({ query: financialFilterSchema }),
  requireFinanceAccess,
  reportController.financialSummary.bind(reportController),
);

export default router;
