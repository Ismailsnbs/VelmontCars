// Vehicle Document controller
import { Request, Response, NextFunction } from 'express';
import { vehicleDocumentService } from '../services/vehicleDocument.service';
import { sendSuccess } from '../utils/helpers';

export class VehicleDocumentController {
  async getByVehicleId(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params as { vehicleId: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const documents = await vehicleDocumentService.getByVehicleId(
        vehicleId,
        galleryId
      );

      sendSuccess(res, documents);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params as { vehicleId: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const document = await vehicleDocumentService.create(
        req.body,
        vehicleId,
        galleryId
      );

      sendSuccess(res, document, 201);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params as { documentId: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const result = await vehicleDocumentService.delete(documentId, galleryId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const vehicleDocumentController = new VehicleDocumentController();
