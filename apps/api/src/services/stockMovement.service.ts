// Stock movement service with transaction-based inventory management
import prisma from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';
import { CreateStockMovementInput } from '../validations/stockMovement.validation';
import { emitToGallery } from '../socket';
import { SOCKET_EVENTS } from '../socket/events';

interface GetByProductIdParams {
  productId: string;
  galleryId: string;
  limit: number;
  skip: number;
}

export class StockMovementService {
  /**
   * Get stock movements for a product (paginated, gallery isolated)
   * Multi-tenant: checks product.galleryId
   */
  async getByProductId(params: GetByProductIdParams) {
    const { productId, galleryId, limit, skip } = params;

    // SECURITY: findFirst with compound { id, galleryId } enforces tenant isolation atomically at DB level
    const product = await prisma.product.findFirst({
      where: { id: productId, galleryId },
    });

    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} not found`);
    }

    // Fetch movements with pagination — galleryId JOIN filtresi ile TOCTOU koruması
    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { productId, product: { galleryId } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockMovement.count({
        where: { productId, product: { galleryId } },
      }),
    ]);

    return { data: movements, total };
  }

  /**
   * Create a stock movement and update product.currentStock (TRANSACTION)
   * Multi-tenant: checks product.galleryId
   * - IN: increment stock
   * - OUT: decrement stock (validate sufficient stock)
   * - ADJUSTMENT: set stock to exact quantity
   */
  async create(input: CreateStockMovementInput, galleryId: string, userId: string) {
    // Tüm guard sorguları ve yazma işlemleri tek atomik transaction içinde —
    // Eş zamanlı OUT hareketlerinin stoku eksi çekmesini önler (TOCTOU koruması).
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ürünü doğrula — bu galeriye ait olmalı (tx içinde — atomik kilit)
      // SECURITY: findFirst with compound { id, galleryId } enforces tenant isolation atomically at DB level
      const product = await tx.product.findFirst({
        where: { id: input.productId, galleryId },
      });

      if (!product) {
        throw new NotFoundError(`Product with ID ${input.productId} not found`);
      }

      // 2. OUT hareketleri için stok yeterliliğini doğrula
      if (input.type === 'OUT' && Number(product.currentStock) < input.quantity) {
        throw new BadRequestError(
          `Insufficient stock: current=${product.currentStock}, requested=${input.quantity}`
        );
      }

      // 3. Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          type: input.type,
          quantity: input.quantity,
          note: input.note,
          productId: input.productId,
          createdBy: userId,
        },
      });

      // 4. Update product currentStock
      let updateData: { currentStock: number | { increment: number } | { decrement: number } } = { currentStock: 0 };
      if (input.type === 'IN') {
        updateData = { currentStock: { increment: input.quantity } };
      } else if (input.type === 'OUT') {
        updateData = { currentStock: { decrement: input.quantity } };
      } else if (input.type === 'ADJUSTMENT') {
        // For ADJUSTMENT, set stock to the exact quantity
        updateData = { currentStock: input.quantity };
      }

      const updatedProduct = await tx.product.update({
        where: { id: input.productId },
        data: updateData,
      });

      return { movement, updatedProduct };
    });

    try {
      emitToGallery(galleryId, SOCKET_EVENTS.STOCK_MOVEMENT, {
        productId: input.productId,
        type: input.type,
        quantity: input.quantity,
        newStock: Number(result.updatedProduct.currentStock),
      });
    } catch (emitError) {
      console.error('[StockMovementService] Socket emit error (create):', emitError);
    }

    return result;
  }

  /**
   * Delete a stock movement and reverse its effect (TRANSACTION)
   * Multi-tenant: checks product.galleryId
   * Reverses the stock adjustment based on movement type
   */
  async delete(id: string, galleryId: string) {
    // SECURITY: findFirst with compound { id, product: { galleryId } } enforces tenant isolation
    // atomically at DB level — avoids a separate gallery-check step (TOCTOU koruması).
    const movement = await prisma.stockMovement.findFirst({
      where: { id, product: { galleryId } },
      include: { product: true },
    });

    if (!movement) {
      throw new NotFoundError(`Stock movement with ID ${id} not found`);
    }

    // Execute transaction: delete movement + reverse stock
    await prisma.$transaction(async tx => {
      // Delete the movement
      await tx.stockMovement.delete({ where: { id } });

      // Reverse the stock adjustment
      let updateData: any = {};
      if (movement.type === 'IN') {
        // If it was an IN, decrement to reverse
        updateData = { currentStock: { decrement: movement.quantity } };
      } else if (movement.type === 'OUT') {
        // If it was an OUT, increment to reverse
        updateData = { currentStock: { increment: movement.quantity } };
      } else if (movement.type === 'ADJUSTMENT') {
        // For ADJUSTMENT, recalculate based on other movements
        // Get all other movements for this product, ordered by date
        const otherMovements = await tx.stockMovement.findMany({
          where: { productId: movement.productId },
          orderBy: { createdAt: 'asc' },
        });

        // Recalculate stock from scratch
        let newStock = 0;
        for (const m of otherMovements) {
          if (m.type === 'IN') {
            newStock += Number(m.quantity);
          } else if (m.type === 'OUT') {
            newStock -= Number(m.quantity);
          } else if (m.type === 'ADJUSTMENT') {
            newStock = Number(m.quantity);
          }
        }

        updateData = { currentStock: newStock };
      }

      await tx.product.update({
        where: { id: movement.productId },
        data: updateData,
      });
    });

    return { id };
  }

  /**
   * Get recent stock movements for a gallery (for dashboard)
   * Multi-tenant: filtered by gallery
   */
  async getRecent(galleryId: string, limit: number = 10) {
    const movements = await prisma.stockMovement.findMany({
      where: {
        product: {
          galleryId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        product: {
          select: { id: true, name: true },
        },
      },
    });

    return movements;
  }
}

export const stockMovementService = new StockMovementService();
