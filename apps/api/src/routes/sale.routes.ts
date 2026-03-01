// Sale routes — multi-tenant, requires authentication and gallery access
import { Router } from 'express';
import { saleController } from '../controllers/sale.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGalleryAccess, requireRole } from '../middleware/role.middleware';
import { galleryTenant } from '../middleware/gallery.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createSaleSchema,
  updateSaleSchema,
  saleQuerySchema,
  saleIdParamSchema,
} from '../validations/sale.validation';

const router = Router();

// All sale routes require authentication, gallery access, and tenant isolation
router.use(authenticate, requireGalleryAccess, galleryTenant);

// GET /sales         — paginated list with optional date range filter
router.get(
  '/',
  validate({ query: saleQuerySchema }),
  saleController.getAll.bind(saleController),
);

// GET /sales/stats   — sale statistics (must be before /:id)
router.get('/stats', saleController.getStats.bind(saleController));

// GET /sales/:id     — single sale with vehicle + customer details
router.get(
  '/:id',
  validate({ params: saleIdParamSchema }),
  saleController.getById.bind(saleController),
);

// POST /sales        — create a new sale (auto profit calculation + vehicle status update)
router.post(
  '/',
  validate({ body: createSaleSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  saleController.create.bind(saleController),
);

// PUT /sales/:id     — update a sale (salePrice, notes, paymentMethod only)
router.put(
  '/:id',
  validate({ params: saleIdParamSchema, body: updateSaleSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER'),
  saleController.update.bind(saleController),
);

// POST /sales/:id/cancel — cancel a sale, return vehicle to IN_STOCK
router.post(
  '/:id/cancel',
  validate({ params: saleIdParamSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER'),
  saleController.cancel.bind(saleController),
);

export default router;
