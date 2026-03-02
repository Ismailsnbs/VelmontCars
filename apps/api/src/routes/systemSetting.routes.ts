import { Router } from 'express';
import { systemSettingController } from '../controllers/systemSetting.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireMasterAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateSettingSchema } from '../validations/systemSetting.validation';

const router = Router();

// GET all settings - requires MASTER_ADMIN
router.get('/', authenticate, requireMasterAdmin, systemSettingController.getAll.bind(systemSettingController));

// GET single setting by key - any authenticated user
router.get('/:key', authenticate, systemSettingController.getByKey.bind(systemSettingController));

// PUT (upsert) setting - requires MASTER_ADMIN
router.put(
  '/:key',
  authenticate,
  requireMasterAdmin,
  validate({ body: updateSettingSchema }),
  systemSettingController.update.bind(systemSettingController),
);

export default router;
