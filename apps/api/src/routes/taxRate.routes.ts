import { Router } from 'express';
import { taxRateController } from '../controllers/taxRate.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireMasterAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createTaxRateSchema, updateTaxRateSchema } from '../validations/taxRate.validation';
import { idParamSchema } from '../validations/common.validation';

const router = Router();

router.use(authenticate, requireMasterAdmin);

router.get('/', taxRateController.getAll.bind(taxRateController));
router.get('/active', taxRateController.getActive.bind(taxRateController));
router.get('/:id', validate({ params: idParamSchema }), taxRateController.getById.bind(taxRateController));
router.get('/:id/history', validate({ params: idParamSchema }), taxRateController.getHistory.bind(taxRateController));
router.post('/', validate({ body: createTaxRateSchema }), taxRateController.create.bind(taxRateController));
router.put('/:id', validate({ params: idParamSchema, body: updateTaxRateSchema }), taxRateController.update.bind(taxRateController));
router.delete('/:id', validate({ params: idParamSchema }), taxRateController.delete.bind(taxRateController));

export default router;
