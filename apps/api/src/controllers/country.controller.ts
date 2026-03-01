// OriginCountry CRUD controller
import { Request, Response, NextFunction } from 'express';
import { countryService } from '../services/country.service';
import { sendSuccess, sendPaginated, parsePagination } from '../utils/helpers';

export class CountryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip, sortBy, sortOrder } = parsePagination(req.query);
      const search = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;
      const isActive = Array.isArray(req.query.isActive) ? req.query.isActive[0] : req.query.isActive;

      const result = await countryService.getAll({
        page,
        limit,
        skip,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        search: search as string | undefined,
        isActive: isActive ? isActive === 'true' : undefined,
      });

      sendPaginated(res, result.data, result.total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const country = await countryService.getById(id);
      sendSuccess(res, country);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const ipAddress = req.ip || undefined;

      const country = await countryService.create(req.body, userId, ipAddress);
      sendSuccess(res, country, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const userId = (req as any).user.userId;
      const ipAddress = req.ip || undefined;

      const country = await countryService.update(id, req.body, userId, ipAddress);
      sendSuccess(res, country);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const userId = (req as any).user.userId;
      const ipAddress = req.ip || undefined;

      const result = await countryService.delete(id, userId, ipAddress);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getActive(_req: Request, res: Response, next: NextFunction) {
    try {
      const countries = await countryService.getActiveCountries();
      sendSuccess(res, countries);
    } catch (error) {
      next(error);
    }
  }
}

export const countryController = new CountryController();
