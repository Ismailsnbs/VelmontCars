// Customer CRUD controller
import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer.service';
import { sendSuccess, sendPaginated, parsePagination } from '../utils/helpers';

export class CustomerController {
  /**
   * GET /customers - Get all customers with pagination and filtering
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const { page, limit, skip, sortBy, sortOrder } = parsePagination(req.query);

      const search = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;

      const result = await customerService.getAll({
        galleryId,
        page,
        limit,
        skip,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        search: search as string | undefined,
      });

      sendPaginated(res, result.data, result.total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /customers/stats - Get customer statistics
   */
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = _req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const stats = await customerService.getStats(galleryId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /customers/:id - Get single customer by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const customer = await customerService.getById(id, galleryId);
      sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /customers - Create a new customer
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const customer = await customerService.create(req.body, galleryId);
      sendSuccess(res, customer, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /customers/:id - Update a customer
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const customer = await customerService.update(id, req.body, galleryId);
      sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /customers/:id - Delete a customer
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const result = await customerService.delete(id, galleryId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const customerController = new CustomerController();
