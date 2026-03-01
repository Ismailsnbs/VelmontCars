// Product CRUD routes with multi-tenant isolation
import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGalleryAccess, requireRole } from '../middleware/role.middleware';
import { galleryTenant } from '../middleware/gallery.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../validations/product.validation';
import { idParamSchema } from '../validations/common.validation';

const router = Router();

// All product routes require authentication, gallery access, and tenant isolation
router.use(authenticate, requireGalleryAccess, galleryTenant);

// GET /products       — paginated list with filters and search
router.get('/', validate({ query: productQuerySchema }), productController.getAll.bind(productController));

// GET /products/stats — product statistics (must be before /:id)
router.get('/stats', productController.getStats.bind(productController));

// GET /products/:id   — single product with stock movements
router.get('/:id', validate({ params: idParamSchema }), productController.getById.bind(productController));

// POST /products      — create a new product
router.post('/', validate({ body: createProductSchema }), requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'), productController.create.bind(productController));

// PUT /products/:id   — update a product
router.put('/:id', validate({ params: idParamSchema, body: updateProductSchema }), requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'), productController.update.bind(productController));

// DELETE /products/:id — delete a product
router.delete('/:id', validate({ params: idParamSchema }), requireRole('GALLERY_OWNER', 'GALLERY_MANAGER'), productController.delete.bind(productController));

export default router;
