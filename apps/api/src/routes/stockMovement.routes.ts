// Stock movement CRUD routes with multi-tenant isolation
import { Router } from 'express';
import { stockMovementController } from '../controllers/stockMovement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGalleryAccess, requireRole } from '../middleware/role.middleware';
import { galleryTenant } from '../middleware/gallery.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createStockMovementSchema,
  stockMovementQuerySchema,
  productIdParamSchema,
  stockMovementIdParamSchema,
} from '../validations/stockMovement.validation';

const router = Router();

// All stock movement routes require authentication, gallery access, and tenant isolation
router.use(authenticate, requireGalleryAccess, galleryTenant);

// GET /stock-movements/recent - recent movements (must be before /product/:productId)
router.get('/recent', stockMovementController.getRecent.bind(stockMovementController));

// GET /stock-movements/product/:productId - movements for a product (paginated)
router.get(
  '/product/:productId',
  validate({ params: productIdParamSchema, query: stockMovementQuerySchema }),
  stockMovementController.getByProductId.bind(stockMovementController)
);

// POST /stock-movements - create a stock movement
router.post(
  '/',
  validate({ body: createStockMovementSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  stockMovementController.create.bind(stockMovementController)
);

// DELETE /stock-movements/:id - delete a stock movement
router.delete(
  '/:id',
  validate({ params: stockMovementIdParamSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER'),
  stockMovementController.delete.bind(stockMovementController)
);

export default router;
