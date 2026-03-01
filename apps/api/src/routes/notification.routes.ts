import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireMasterAdmin, requireGalleryAccess } from '../middleware/role.middleware';
import { galleryTenant } from '../middleware/gallery.middleware';
import { validate } from '../middleware/validate.middleware';
import { createNotificationSchema, notificationQuerySchema, galleryNotificationQuerySchema } from '../validations/notification.validation';
import { idParamSchema } from '../validations/common.validation';

const router = Router();

router.use(authenticate);

// Master Admin routes — collection
router.get(
  '/',
  requireMasterAdmin,
  validate({ query: notificationQuerySchema }),
  notificationController.getAll.bind(notificationController),
);

router.post(
  '/',
  requireMasterAdmin,
  validate({ body: createNotificationSchema }),
  notificationController.create.bind(notificationController),
);

// Gallery routes — static paths must come before /:id to avoid shadowing
router.get(
  '/gallery',
  requireGalleryAccess,
  galleryTenant,
  validate({ query: galleryNotificationQuerySchema }),
  notificationController.getForGallery.bind(notificationController),
);

router.get(
  '/unread-count',
  requireGalleryAccess,
  galleryTenant,
  notificationController.getUnreadCount.bind(notificationController),
);

// Master Admin routes — individual resource (dynamic :id, must be after static paths)
router.get(
  '/:id',
  requireMasterAdmin,
  validate({ params: idParamSchema }),
  notificationController.getById.bind(notificationController),
);

router.delete(
  '/:id',
  requireMasterAdmin,
  validate({ params: idParamSchema }),
  notificationController.delete.bind(notificationController),
);

// Gallery routes — action on individual resource
router.post(
  '/:id/read',
  requireGalleryAccess,
  galleryTenant,
  validate({ params: idParamSchema }),
  notificationController.markAsRead.bind(notificationController),
);

export default router;
