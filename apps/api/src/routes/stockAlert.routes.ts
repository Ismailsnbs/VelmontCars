// Stock Alert routes for low stock monitoring
import { Router } from 'express';
import { stockAlertController } from '../controllers/stockAlert.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGalleryAccess, requireRole } from '../middleware/role.middleware';
import { galleryTenant } from '../middleware/gallery.middleware';
import { validate } from '../middleware/validate.middleware';
import { lowStockQuerySchema, checkAlertSchema } from '../validations/stockAlert.validation';

const router = Router();

// All stock alert routes require authentication, gallery access, and tenant isolation
router.use(authenticate, requireGalleryAccess, galleryTenant);

// GET /stock-alerts/low-stock — get all low stock products for gallery
router.get(
  '/low-stock',
  validate({ query: lowStockQuerySchema }),
  stockAlertController.getLowStockProducts.bind(stockAlertController),
);

// POST /stock-alerts/check — check for low stock and create notification
router.post(
  '/check',
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER'),
  validate({ body: checkAlertSchema }),
  stockAlertController.checkAndAlert.bind(stockAlertController),
);

export default router;
