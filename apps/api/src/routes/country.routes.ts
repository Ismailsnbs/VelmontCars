import { Router } from 'express';
import { countryController } from '../controllers/country.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireMasterAdmin, requireGalleryAccess } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createCountrySchema, updateCountrySchema } from '../validations/country.validation';
import { idParamSchema } from '../validations/common.validation';

const router = Router();

// Tüm route'lar authenticate gerektirir
router.use(authenticate);

// GET /countries/active - Aktif ülkeler (calculator için tüm galeri kullanıcıları)
router.get('/active', requireGalleryAccess, countryController.getActive.bind(countryController));

// Master Admin route'ları
router.get('/', requireMasterAdmin, countryController.getAll.bind(countryController));
router.get('/:id', requireMasterAdmin, validate({ params: idParamSchema }), countryController.getById.bind(countryController));
router.post('/', requireMasterAdmin, validate({ body: createCountrySchema }), countryController.create.bind(countryController));
router.put('/:id', requireMasterAdmin, validate({ params: idParamSchema, body: updateCountrySchema }), countryController.update.bind(countryController));
router.delete('/:id', requireMasterAdmin, validate({ params: idParamSchema }), countryController.delete.bind(countryController));

export default router;
