// Customer CRUD routes with multi-tenant isolation
import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGalleryAccess, requireRole } from '../middleware/role.middleware';
import { galleryTenant } from '../middleware/gallery.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
} from '../validations/customer.validation';
import { idParamSchema } from '../validations/common.validation';

const router = Router();

// All customer routes require authentication, gallery access, and tenant isolation
router.use(authenticate, requireGalleryAccess, galleryTenant);

// GET /customers       — paginated list with filters and search
router.get('/', validate({ query: customerQuerySchema }), customerController.getAll.bind(customerController));

// GET /customers/stats — customer statistics (must be before /:id)
router.get('/stats', customerController.getStats.bind(customerController));

// GET /customers/:id   — single customer with sales
router.get('/:id', validate({ params: idParamSchema }), customerController.getById.bind(customerController));

// POST /customers      — create a new customer
router.post('/', validate({ body: createCustomerSchema }), requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'), customerController.create.bind(customerController));

// PUT /customers/:id   — update a customer
router.put('/:id', validate({ params: idParamSchema, body: updateCustomerSchema }), requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'), customerController.update.bind(customerController));

// DELETE /customers/:id — delete a customer
router.delete('/:id', validate({ params: idParamSchema }), requireRole('GALLERY_OWNER', 'GALLERY_MANAGER'), customerController.delete.bind(customerController));

export default router;
