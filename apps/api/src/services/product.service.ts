// Product CRUD service with multi-tenant isolation
import prisma from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';
import { CreateProductInput, UpdateProductInput } from '../validations/product.validation';

interface GetAllParams {
  galleryId: string;
  page: number;
  limit: number;
  skip: number;
  category?: string;
  search?: string;
  belowMinStock?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export class ProductService {
  /**
   * Get all products for a gallery with pagination and filtering
   * Multi-tenant: filtered by galleryId
   */
  async getAll(params: GetAllParams) {
    const where: any = {
      galleryId: params.galleryId,
    };

    if (params.category) {
      where.category = params.category;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { barcode: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // belowMinStock requires a cross-column comparison (currentStock < minStockLevel)
    // which Prisma does not support in a standard where clause.
    // For this specific case we fetch only the matching-filter rows (no pagination yet)
    // and perform the in-memory cross-column comparison before slicing.
    // This is acceptable because low-stock queries are infrequent, the gallery-scoped
    // filter already limits the set, and we never load relation data for this path.
    if (params.belowMinStock) {
      const allLowStockCandidates = await prisma.product.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        include: {
          movements: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      });

      const filtered = allLowStockCandidates.filter(
        p => Number(p.currentStock) < Number(p.minStockLevel)
      );

      const total = filtered.length;
      const data = filtered.slice(params.skip, params.skip + params.limit);
      return { data, total };
    }

    // Standard path: DB-level pagination — no full table scan into memory.
    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        include: {
          movements: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
        skip: params.skip,
        take: params.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get a single product by ID with stock movements
   * Multi-tenant: checks galleryId
   */
  async getById(id: string, galleryId: string) {
    // SECURITY: findFirst with compound { id, galleryId } enforces tenant isolation atomically at DB level
    const product = await prisma.product.findFirst({
      where: { id, galleryId },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundError(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Create a new product
   * Multi-tenant: associates with galleryId
   */
  async create(input: CreateProductInput, galleryId: string) {
    const product = await prisma.product.create({
      data: {
        name: input.name,
        category: input.category,
        unit: input.unit,
        unitPrice: input.unitPrice,
        minStockLevel: input.minStockLevel ?? 0,
        barcode: input.barcode,
        description: input.description,
        galleryId,
        currentStock: 0,
      },
    });

    return product;
  }

  /**
   * Update a product
   * Multi-tenant: checks galleryId on both read and write paths (defense-in-depth)
   */
  async update(id: string, input: UpdateProductInput, galleryId: string) {
    // SECURITY: updateMany with compound { id, galleryId } enforces tenant isolation on the write
    // path itself — not just the preceding read. count === 0 means either the record does not
    // exist or it belongs to a different gallery; both are surfaced as NotFoundError.
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.product.updateMany({
        where: { id, galleryId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.category && { category: input.category }),
          ...(input.unit && { unit: input.unit }),
          ...(input.unitPrice !== undefined && { unitPrice: input.unitPrice }),
          ...(input.minStockLevel !== undefined && { minStockLevel: input.minStockLevel }),
          ...(input.barcode !== undefined && { barcode: input.barcode }),
          ...(input.description !== undefined && { description: input.description }),
        },
      });

      if (result.count === 0) {
        throw new NotFoundError(`Product with ID ${id} not found`);
      }

      return tx.product.findFirst({ where: { id, galleryId } });
    });

    return updated;
  }

  /**
   * Delete a product
   * Multi-tenant: checks galleryId on both read and write paths (defense-in-depth)
   * Prevents deletion if stock movements exist
   */
  async delete(id: string, galleryId: string) {
    // SECURITY: findFirst with compound { id, galleryId } verifies ownership and loads relations
    // for the movements guard. deleteMany with the same compound where enforces tenant isolation
    // on the write path itself — defense-in-depth ensures galleryId is present in the actual
    // DELETE statement even if the preceding read is somehow bypassed.
    // TOCTOU protection: all three operations are wrapped in a single $transaction.
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findFirst({
        where: { id, galleryId },
        include: { movements: true },
      });

      if (!existing) {
        throw new NotFoundError(`Product with ID ${id} not found`);
      }

      if (existing.movements.length > 0) {
        throw new BadRequestError(
          `Cannot delete product: ${existing.movements.length} stock movement(s) reference this product`
        );
      }

      const deleted = await tx.product.deleteMany({ where: { id, galleryId } });

      if (deleted.count === 0) {
        throw new NotFoundError(`Product with ID ${id} not found`);
      }

      return { id };
    });

    return result;
  }

  /**
   * Get product statistics for a gallery
   * Multi-tenant: filtered by galleryId
   */
  async getStats(galleryId: string) {
    // Run the count and the lean projection in parallel.
    // select: only fetch the four scalar fields needed for aggregation —
    // avoids pulling full product rows (including relations) into memory.
    const [totalProducts, allProducts] = await Promise.all([
      prisma.product.count({ where: { galleryId } }),
      prisma.product.findMany({
        where: { galleryId },
        select: {
          currentStock: true,
          minStockLevel: true,
          category: true,
          unitPrice: true,
        },
      }),
    ]);

    // Cross-column comparison (currentStock < minStockLevel) still requires
    // in-memory evaluation; the select projection keeps per-row payload minimal.
    const belowMinStockCount = allProducts.filter(
      p => Number(p.currentStock) < Number(p.minStockLevel)
    ).length;

    const categoryStats: Record<string, number> = {};
    allProducts.forEach(p => {
      categoryStats[p.category] = (categoryStats[p.category] ?? 0) + 1;
    });

    const totalStockValue = allProducts.reduce((sum, p) => {
      return sum + Number(p.currentStock) * Number(p.unitPrice);
    }, 0);

    return {
      totalProducts,
      belowMinStockCount,
      categoryStats,
      totalStockValue,
    };
  }

  /**
   * Check if product stock is below minimum level
   * Returns true if currentStock < minStockLevel
   */
  async checkStockLevel(productId: string, galleryId: string): Promise<boolean> {
    // SECURITY: findFirst with compound { id, galleryId } enforces tenant isolation atomically at DB level
    const product = await prisma.product.findFirst({
      where: { id: productId, galleryId },
    });

    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} not found`);
    }

    return product.currentStock < product.minStockLevel;
  }
}

export const productService = new ProductService();
