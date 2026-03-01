// Dashboard routes — stats endpoints
import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGalleryAccess } from '../middleware/role.middleware';
import { galleryTenant } from '../middleware/gallery.middleware';

const router = Router();

// All dashboard routes require authentication and gallery access
router.use(authenticate, requireGalleryAccess, galleryTenant);

// GET /dashboard
router.get('/', (req, res, next) => dashboardController.getStats(req, res).catch(next));

// GET /dashboard/charts
router.get('/charts', (req, res, next) => dashboardController.getCharts(req, res).catch(next));

export default router;
