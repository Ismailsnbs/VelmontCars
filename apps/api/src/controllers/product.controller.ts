// Product CRUD controller
import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { sendSuccess, sendPaginated, parsePagination } from '../utils/helpers';

export class ProductController {
  /**
   * GET /products - Get all products with pagination and filtering
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const { page, limit, skip, sortBy, sortOrder } = parsePagination(req.query);

      const category = Array.isArray(req.query.category) ? req.query.category[0] : req.query.category;
      const search = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;
      const belowMinStock = Array.isArray(req.query.belowMinStock) ? req.query.belowMinStock[0] : req.query.belowMinStock;

      const result = await productService.getAll({
        galleryId,
        page,
        limit,
        skip,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        category: category as string | undefined,
        search: search as string | undefined,
        belowMinStock: belowMinStock ? belowMinStock === 'true' : undefined,
      });

      sendPaginated(res, result.data, result.total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /products/stats - Get product statistics
   */
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = _req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }
      const stats = await productService.getStats(galleryId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /products/:id - Get single product by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const product = await productService.getById(id, galleryId);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /products - Create a new product
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const product = await productService.create(req.body, galleryId);
      sendSuccess(res, product, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /products/:id - Update a product
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const product = await productService.update(id, req.body, galleryId);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /products/:id - Delete a product
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const galleryId = req.galleryId;
      if (!galleryId) {
        return res.status(400).json({ success: false, message: 'Gallery context required' });
      }

      const result = await productService.delete(id, galleryId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
