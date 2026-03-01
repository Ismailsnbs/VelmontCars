import { Router } from 'express';
import { vehicleController } from '../controllers/vehicle.controller';
import { vehicleDocumentController } from '../controllers/vehicleDocument.controller';
import { vehicleExpenseController } from '../controllers/vehicleExpense.controller';
import { vehicleImageController } from '../controllers/vehicleImage.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGalleryAccess, requireRole } from '../middleware/role.middleware';
import { galleryTenant } from '../middleware/gallery.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadSingle, uploadMultiple } from '../middleware/upload.middleware';
import {
  createVehicleSchema,
  updateVehicleSchema,
  updateStatusSchema,
} from '../validations/vehicle.validation';
import {
  vehicleIdParamSchema,
  documentIdParamSchema,
  createDocumentSchema,
} from '../validations/vehicleDocument.validation';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
} from '../validations/vehicleExpense.validation';
import {
  vehicleParamSchema,
  vehicleImageParamsSchema,
  reorderSchema,
} from '../validations/vehicleImage.validation';
import { idParamSchema } from '../validations/common.validation';

const router = Router();

// All vehicle routes require authentication, gallery access, and tenant isolation
router.use(authenticate, requireGalleryAccess, galleryTenant);

// GET /vehicles           — paginated list with filters
router.get('/', vehicleController.getAll.bind(vehicleController));

// GET /vehicles/stats     — summary counts/values (must be before /:id)
router.get('/stats', vehicleController.getStats.bind(vehicleController));

// ─── Document sub-routes ────────────────────────────────────────────────
router.get(
  '/:vehicleId/documents',
  validate({ params: vehicleIdParamSchema }),
  vehicleDocumentController.getByVehicleId.bind(vehicleDocumentController)
);

router.post(
  '/:vehicleId/documents',
  validate({ params: vehicleIdParamSchema, body: createDocumentSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  vehicleDocumentController.create.bind(vehicleDocumentController)
);

router.delete(
  '/:vehicleId/documents/:documentId',
  validate({ params: documentIdParamSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER'),
  vehicleDocumentController.delete.bind(vehicleDocumentController)
);

// ─── Expense sub-routes ─────────────────────────────────────────────────
router.get(
  '/:vehicleId/expenses',
  validate({ params: vehicleIdParamSchema }),
  vehicleExpenseController.getByVehicleId.bind(vehicleExpenseController)
);

router.post(
  '/:vehicleId/expenses',
  validate({ params: vehicleIdParamSchema, body: createExpenseSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  vehicleExpenseController.create.bind(vehicleExpenseController)
);

router.put(
  '/:vehicleId/expenses/:expenseId',
  validate({ params: expenseIdParamSchema, body: updateExpenseSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  vehicleExpenseController.update.bind(vehicleExpenseController)
);

router.delete(
  '/:vehicleId/expenses/:expenseId',
  validate({ params: expenseIdParamSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER'),
  vehicleExpenseController.delete.bind(vehicleExpenseController)
);

// ─── Image sub-routes ─────────────────────────────────────────────────────────

// GET    /vehicles/:vehicleId/images            — list all images for a vehicle
router.get(
  '/:vehicleId/images',
  validate({ params: vehicleParamSchema }),
  vehicleImageController.getByVehicleId.bind(vehicleImageController)
);

// POST   /vehicles/:vehicleId/images/bulk       — bulk image upload (up to 10)
// NOTE: declared before /:vehicleId/images to avoid route collision with /:vehicleId/images/:imageId
router.post(
  '/:vehicleId/images/bulk',
  validate({ params: vehicleParamSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  uploadMultiple,
  vehicleImageController.bulkUpload.bind(vehicleImageController)
);

// POST   /vehicles/:vehicleId/images            — single image upload
router.post(
  '/:vehicleId/images',
  validate({ params: vehicleParamSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  uploadSingle,
  vehicleImageController.upload.bind(vehicleImageController)
);

// PUT    /vehicles/:vehicleId/images/reorder    — reorder images
router.put(
  '/:vehicleId/images/reorder',
  validate({ params: vehicleParamSchema, body: reorderSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  vehicleImageController.reorder.bind(vehicleImageController)
);

// PATCH  /vehicles/:vehicleId/images/:imageId/main — set image as main
router.patch(
  '/:vehicleId/images/:imageId/main',
  validate({ params: vehicleImageParamsSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  vehicleImageController.setMain.bind(vehicleImageController)
);

// DELETE /vehicles/:vehicleId/images/:imageId   — delete one image
router.delete(
  '/:vehicleId/images/:imageId',
  validate({ params: vehicleImageParamsSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER'),
  vehicleImageController.delete.bind(vehicleImageController)
);

// GET /vehicles/:id       — single vehicle with all relations
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  vehicleController.getById.bind(vehicleController)
);

// POST /vehicles          — create a new vehicle
router.post(
  '/',
  validate({ body: createVehicleSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  vehicleController.create.bind(vehicleController)
);

// PUT /vehicles/:id       — full update
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateVehicleSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  vehicleController.update.bind(vehicleController)
);

// PATCH /vehicles/:id/status — status transition
router.patch(
  '/:id/status',
  validate({ params: idParamSchema, body: updateStatusSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  vehicleController.updateStatus.bind(vehicleController)
);

// PATCH /vehicles/:id/move-to-stock — move vehicle from TRANSIT to IN_STOCK
router.patch(
  '/:id/move-to-stock',
  validate({ params: idParamSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'),
  vehicleController.moveToStock.bind(vehicleController)
);

// DELETE /vehicles/:id    — hard delete (guarded against active sale)
router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  requireRole('GALLERY_OWNER', 'GALLERY_MANAGER'),
  vehicleController.delete.bind(vehicleController)
);

export default router;
