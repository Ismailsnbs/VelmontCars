import { Router } from 'express';
import { exchangeRateController } from '../controllers/exchangeRate.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireMasterAdmin, requireGalleryAccess } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  bulkUpdateSchema,
  updateSettingsSchema,
} from '../validations/exchangeRate.validation';
import { codeParamSchema } from '../validations/common.validation';

const router = Router();

// Tüm route'lar authenticate gerektirir
router.use(authenticate);

// GET /exchange-rates/:code — Tek kur (calculator için tüm galeri kullanıcıları)
// ÖNEMLİ: /settings, /fetch, /history path'lerinden SONRA tanımlanmalı
router.get(
  '/current/:code',
  requireGalleryAccess,
  validate({ params: codeParamSchema }),
  exchangeRateController.getByCurrency.bind(exchangeRateController),
);

// Master Admin route'ları
router.get('/', requireMasterAdmin, exchangeRateController.getAll.bind(exchangeRateController));

router.get('/settings', requireMasterAdmin, exchangeRateController.getSettings.bind(exchangeRateController));

router.put(
  '/settings',
  requireMasterAdmin,
  validate({ body: updateSettingsSchema }),
  exchangeRateController.updateSettings.bind(exchangeRateController),
);

router.post('/fetch', requireMasterAdmin, exchangeRateController.fetchFromAPI.bind(exchangeRateController));

router.get(
  '/history/:code',
  requireMasterAdmin,
  validate({ params: codeParamSchema }),
  exchangeRateController.getHistory.bind(exchangeRateController),
);

router.get(
  '/:code',
  requireMasterAdmin,
  validate({ params: codeParamSchema }),
  exchangeRateController.getByCurrency.bind(exchangeRateController),
);

router.put(
  '/',
  requireMasterAdmin,
  validate({ body: bulkUpdateSchema }),
  exchangeRateController.bulkUpdate.bind(exchangeRateController),
);

export default router;
