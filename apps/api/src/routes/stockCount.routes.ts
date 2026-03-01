// Stock Count (Inventory) routes
import { Router } from 'express';
import { stockCountController } from '../controllers/stockCount.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGalleryAccess, requireRole } from '../middleware/role.middleware';
import { galleryTenant } from '../middleware/gallery.middleware';
import { validate } from '../middleware/validate.middleware';
import { stockCountSchema } from '../validations/stockCount.validation';

const router = Router();

// All stock-count routes require authentication, gallery access, tenant isolation, and appropriate role
router.use(authenticate, requireGalleryAccess, requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'), galleryTenant);

// GET /stock-count/products — sayım başlatmak için ürün listesi ve mevcut stok
router.get('/products', stockCountController.getProductsForCount.bind(stockCountController));

// POST /stock-count/preview — farkları göster ama kaydetme
router.post(
  '/preview',
  validate({ body: stockCountSchema }),
  stockCountController.previewCount.bind(stockCountController),
);

// POST /stock-count/apply — sayımı onayla, ADJUSTMENT hareketleri oluştur
router.post(
  '/apply',
  validate({ body: stockCountSchema }),
  stockCountController.applyCount.bind(stockCountController),
);

export default router;
