import { Router } from 'express';
import { auditLogController } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireMasterAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { auditQuerySchema } from '../validations/audit.validation';
import { idParamSchema } from '../validations/common.validation';

const router = Router();

router.use(authenticate, requireMasterAdmin);

router.get('/', validate({ query: auditQuerySchema }), auditLogController.getAll.bind(auditLogController));
router.get('/:id', validate({ params: idParamSchema }), auditLogController.getById.bind(auditLogController));

export default router;
