// Vehicle CRUD controller — gallery-scoped (multi-tenant)
import { Request, Response, NextFunction } from 'express';
import { vehicleService } from '../services/vehicle.service';
import { sendSuccess, sendPaginated, parsePagination } from '../utils/helpers';

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export class VehicleController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const { page, limit, skip, sortBy, sortOrder } = parsePagination(req.query);

      const status = req.query.status as string | undefined;
      const brand = req.query.brand as string | undefined;
      const search = req.query.search as string | undefined;

      const parseIntQuery = (key: string): number | undefined => {
        const val = req.query[key];
        if (!val) return undefined;
        const parsed = parseInt(val as string, 10);
        return isNaN(parsed) ? undefined : parsed;
      };

      const parseFloatQuery = (key: string): number | undefined => {
        const val = req.query[key];
        if (!val) return undefined;
        const parsed = parseFloat(val as string);
        return isNaN(parsed) ? undefined : parsed;
      };

      const result = await vehicleService.getAll({
        galleryId,
        page,
        limit,
        skip,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        status: status as 'TRANSIT' | 'IN_STOCK' | 'RESERVED' | 'SOLD' | undefined,
        brand,
        search,
        yearFrom: parseIntQuery('yearFrom'),
        yearTo: parseIntQuery('yearTo'),
        fobPriceMin: parseFloatQuery('fobPriceMin'),
        fobPriceMax: parseFloatQuery('fobPriceMax'),
        engineCCMin: parseIntQuery('engineCCMin'),
        engineCCMax: parseIntQuery('engineCCMax'),
      });

      sendPaginated(res, result.data, result.total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const vehicle = await vehicleService.getById(id, galleryId);
      sendSuccess(res, vehicle);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const ip = req.ip ? getParam(req.ip as string | string[]) : undefined;
      const vehicle = await vehicleService.create(req.body, galleryId, req.user!.email ?? req.user!.userId, ip);
      sendSuccess(res, vehicle, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const ip = req.ip ? getParam(req.ip as string | string[]) : undefined;
      const vehicle = await vehicleService.update(id, req.body, galleryId, req.user!.email ?? req.user!.userId, ip);
      sendSuccess(res, vehicle);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const ip = req.ip ? getParam(req.ip as string | string[]) : undefined;
      const result = await vehicleService.delete(id, galleryId, req.user!.email ?? req.user!.userId, ip);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const result = await vehicleService.updateStatus(id, req.body, galleryId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const stats = await vehicleService.getStats(galleryId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async moveToStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const { arrivalDate } = req.body as { arrivalDate?: string };

      const result = await vehicleService.moveToStock(id, galleryId, arrivalDate);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const vehicleController = new VehicleController();
