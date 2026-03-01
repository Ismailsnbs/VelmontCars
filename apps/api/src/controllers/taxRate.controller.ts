import { Request, Response, NextFunction } from 'express';
import { taxRateService } from '../services/taxRate.service';
import { sendSuccess, sendPaginated, parsePagination } from '../utils/helpers';
import type { UpdateTaxRateInput } from '../validations/taxRate.validation';

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export class TaxRateController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query);

      let isActive: boolean | undefined;
      if (req.query.isActive === 'true') isActive = true;
      else if (req.query.isActive === 'false') isActive = false;

      const rawSearch = req.query.search;
      const search = rawSearch
        ? getParam(rawSearch as string | string[])
        : undefined;

      const { data, total } = await taxRateService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        skip: pagination.skip,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder as 'asc' | 'desc',
        search,
        isActive,
      });

      sendPaginated(res, data, total, pagination.page, pagination.limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const taxRate = await taxRateService.getById(id);
      sendSuccess(res, taxRate);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip ? getParam(req.ip as string | string[]) : undefined;
      const taxRate = await taxRateService.create(req.body, req.user!.userId, ip);
      sendSuccess(res, taxRate, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason, ...data } = req.body as UpdateTaxRateInput;
      const id = getParam(req.params.id);
      const ip = req.ip ? getParam(req.ip as string | string[]) : undefined;
      const taxRate = await taxRateService.update(
        id,
        data,
        req.user!.userId,
        reason,
        ip,
      );
      sendSuccess(res, taxRate);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const ip = req.ip ? getParam(req.ip as string | string[]) : undefined;
      await taxRateService.delete(id, req.user!.userId, ip);
      sendSuccess(res, { message: 'Tax rate deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const history = await taxRateService.getHistory(id);
      sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }

  async getActive(_req: Request, res: Response, next: NextFunction) {
    try {
      const taxRates = await taxRateService.getActiveTaxRates();
      sendSuccess(res, taxRates);
    } catch (error) {
      next(error);
    }
  }
}

export const taxRateController = new TaxRateController();
