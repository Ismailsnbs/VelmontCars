import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from '../validations/auth.validation';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter, strictLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register.bind(authController));
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login.bind(authController));
router.post('/refresh', strictLimiter, validate({ body: refreshSchema }), authController.refresh.bind(authController));
router.post('/logout', authenticate, validate({ body: logoutSchema }), authController.logout.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));

export default router;
