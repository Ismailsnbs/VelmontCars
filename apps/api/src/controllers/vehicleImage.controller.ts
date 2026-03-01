// VehicleImage controller — gallery-scoped (multi-tenant)
import { Request, Response, NextFunction } from 'express';
import { vehicleImageService } from '../services/vehicleImage.service';
import { sendSuccess } from '../utils/helpers';
import { BadRequestError } from '../middleware/error.middleware';

export class VehicleImageController {
  // ── GET /:vehicleId/images ─────────────────────────────────────────────

  async getByVehicleId(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params as { vehicleId: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const images = await vehicleImageService.getByVehicleId(vehicleId, galleryId);
      sendSuccess(res, images);
    } catch (error) {
      next(error);
    }
  }

  // ── POST /:vehicleId/images (single upload) ────────────────────────────

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params as { vehicleId: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      if (!req.file) {
        throw new BadRequestError('No image file provided. Use the "image" field.');
      }

      // Optional: client can request the uploaded image to be the main one
      const isMain = req.body?.isMain === 'true' || req.body?.isMain === true;

      const image = await vehicleImageService.uploadAndCreate(
        req.file,
        vehicleId,
        galleryId,
        isMain
      );

      sendSuccess(res, image, 201);
    } catch (error) {
      next(error);
    }
  }

  // ── POST /:vehicleId/images/bulk ───────────────────────────────────────

  async bulkUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params as { vehicleId: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        throw new BadRequestError(
          'No image files provided. Use the "images" field (multipart/form-data).'
        );
      }

      const images = await vehicleImageService.bulkUpload(files, vehicleId, galleryId);
      sendSuccess(res, images, 201);
    } catch (error) {
      next(error);
    }
  }

  // ── DELETE /:vehicleId/images/:imageId ────────────────────────────────

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { imageId } = req.params as { vehicleId: string; imageId: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const result = await vehicleImageService.delete(imageId, galleryId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ── PATCH /:vehicleId/images/:imageId/main ────────────────────────────

  async setMain(req: Request, res: Response, next: NextFunction) {
    try {
      const { imageId } = req.params as { vehicleId: string; imageId: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const image = await vehicleImageService.setMain(imageId, galleryId);
      sendSuccess(res, image);
    } catch (error) {
      next(error);
    }
  }

  // ── PUT /:vehicleId/images/reorder ────────────────────────────────────

  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params as { vehicleId: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const { imageIds } = req.body as { imageIds: string[] };

      const images = await vehicleImageService.reorder(vehicleId, galleryId, imageIds);
      sendSuccess(res, images);
    } catch (error) {
      next(error);
    }
  }
}

export const vehicleImageController = new VehicleImageController();
