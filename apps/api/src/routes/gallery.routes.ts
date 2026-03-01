import { Router } from 'express';
import { galleryController } from '../controllers/gallery.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireMasterAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createGallerySchema, updateGallerySchema } from '../validations/gallery.validation';
import { idParamSchema } from '../validations/common.validation';

const router = Router();

// Tüm route'lar authenticate + requireMasterAdmin gerektirir
router.use(authenticate, requireMasterAdmin);

router.get('/', galleryController.getAll.bind(galleryController));
router.get('/:id', validate({ params: idParamSchema }), galleryController.getById.bind(galleryController));
router.get('/:id/stats', validate({ params: idParamSchema }), galleryController.getStats.bind(galleryController));
router.post('/', validate({ body: createGallerySchema }), galleryController.create.bind(galleryController));
router.put('/:id', validate({ params: idParamSchema, body: updateGallerySchema }), galleryController.update.bind(galleryController));
router.delete('/:id', validate({ params: idParamSchema }), galleryController.delete.bind(galleryController));

export default router;
