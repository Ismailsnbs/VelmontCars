import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockMovementService } from '../stockMovement.service';
import { NotFoundError, BadRequestError } from '../../middleware/error.middleware';

// ------------------------------------------------------------------ //
// Prisma mock
// ------------------------------------------------------------------ //

// $transaction mock: if passed a function, invoke it with txMock
const txMock = {
  stockMovement: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
  product: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('../../lib/prisma', () => ({
  default: {
    product: {
      findFirst: vi.fn(),
    },
    stockMovement: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn(txMock)),
  },
}));

// Socket mock — we don't want real socket.io in unit tests
vi.mock('../../socket', () => ({
  emitToGallery: vi.fn(),
}));

import prisma from '../../lib/prisma';
import { emitToGallery } from '../../socket';

// ------------------------------------------------------------------ //
// Fixtures
// ------------------------------------------------------------------ //

const GALLERY_ID = 'gallery-aaa-111';
const OTHER_GALLERY_ID = 'gallery-bbb-222';
const PRODUCT_ID = 'product-ccc-333';
const MOVEMENT_ID = 'movement-ddd-444';
const USER_ID = 'user-eee-555';

const mockProduct = {
  id: PRODUCT_ID,
  name: 'Engine Oil',
  category: 'CHEMICAL',
  unit: 'litre',
  unitPrice: 150,
  minStockLevel: 10,
  currentStock: 50,
  galleryId: GALLERY_ID,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockMovement = {
  id: MOVEMENT_ID,
  type: 'IN',
  quantity: 10,
  note: 'Restock',
  productId: PRODUCT_ID,
  createdBy: USER_ID,
  createdAt: new Date('2024-06-01'),
};

const mockUpdatedProduct = { ...mockProduct, currentStock: 60 };

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //

describe('StockMovementService', () => {
  let service: StockMovementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StockMovementService();
    // Reset transaction mock to default function-based behaviour
    vi.mocked(prisma.$transaction).mockImplementation((fn: any) => fn(txMock));
  });

  // ---------------------------------------------------------------- //
  // getByProductId
  // ---------------------------------------------------------------- //
  describe('getByProductId', () => {
    const baseParams = {
      productId: PRODUCT_ID,
      galleryId: GALLERY_ID,
      limit: 20,
      skip: 0,
    };

    it('should return paginated movements and total count for a valid product', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([mockMovement] as any);
      vi.mocked(prisma.stockMovement.count).mockResolvedValue(1);

      const result = await service.getByProductId(baseParams);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw NotFoundError when product does not exist', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(service.getByProductId(baseParams)).rejects.toThrow(NotFoundError);
    });

    it('should include the product ID in the NotFoundError message when product is missing', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(
        service.getByProductId({ ...baseParams, productId: 'missing-product' }),
      ).rejects.toThrow('missing-product');
    });

    it('should throw NotFoundError when product belongs to a different gallery (tenant isolation)', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(
        service.getByProductId({ ...baseParams, galleryId: OTHER_GALLERY_ID }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should not query movements when product lookup fails', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(service.getByProductId(baseParams)).rejects.toThrow();
      expect(prisma.stockMovement.findMany).not.toHaveBeenCalled();
    });

    it('should filter movements by productId', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([]);
      vi.mocked(prisma.stockMovement.count).mockResolvedValue(0);

      await service.getByProductId(baseParams);

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { productId: PRODUCT_ID, product: { galleryId: GALLERY_ID } } }),
      );
    });

    it('should apply skip and take for pagination', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([]);
      vi.mocked(prisma.stockMovement.count).mockResolvedValue(0);

      await service.getByProductId({ ...baseParams, skip: 10, limit: 5 });

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it('should order movements by createdAt descending', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([]);
      vi.mocked(prisma.stockMovement.count).mockResolvedValue(0);

      await service.getByProductId(baseParams);

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });

    it('should return empty data when product has no movements', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([]);
      vi.mocked(prisma.stockMovement.count).mockResolvedValue(0);

      const result = await service.getByProductId(baseParams);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ---------------------------------------------------------------- //
  // create — IN
  // ---------------------------------------------------------------- //
  describe('create (IN)', () => {
    const inInput = {
      productId: PRODUCT_ID,
      type: 'IN' as const,
      quantity: 10,
      note: 'Restock',
    };

    it('should create an IN movement and return movement + updatedProduct', async () => {
      txMock.product.findFirst.mockResolvedValue(mockProduct);
      txMock.stockMovement.create.mockResolvedValue(mockMovement);
      txMock.product.update.mockResolvedValue(mockUpdatedProduct);

      const result = await service.create(inInput, GALLERY_ID, USER_ID);

      expect(result.movement.id).toBe(MOVEMENT_ID);
      expect(result.updatedProduct.currentStock).toBe(60);
    });

    it('should use increment operation for IN movements', async () => {
      txMock.product.findFirst.mockResolvedValue(mockProduct);
      txMock.stockMovement.create.mockResolvedValue(mockMovement);
      txMock.product.update.mockResolvedValue(mockUpdatedProduct);

      await service.create(inInput, GALLERY_ID, USER_ID);

      expect(txMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { currentStock: { increment: 10 } },
        }),
      );
    });

    it('should throw NotFoundError when product does not exist', async () => {
      txMock.product.findFirst.mockResolvedValue(null);

      await expect(service.create(inInput, GALLERY_ID, USER_ID)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when product belongs to a different gallery (tenant isolation)', async () => {
      // gallery check is done via findFirst(where: { id, galleryId }) inside tx
      txMock.product.findFirst.mockResolvedValue(null);

      await expect(
        service.create(inInput, OTHER_GALLERY_ID, USER_ID),
      ).rejects.toThrow(NotFoundError);
    });

    it('should store createdBy (userId) on the movement record', async () => {
      txMock.product.findFirst.mockResolvedValue(mockProduct);
      txMock.stockMovement.create.mockResolvedValue(mockMovement);
      txMock.product.update.mockResolvedValue(mockUpdatedProduct);

      await service.create(inInput, GALLERY_ID, USER_ID);

      expect(txMock.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ createdBy: USER_ID }),
        }),
      );
    });

    it('should emit STOCK_MOVEMENT socket event after successful create', async () => {
      txMock.product.findFirst.mockResolvedValue(mockProduct);
      txMock.stockMovement.create.mockResolvedValue(mockMovement);
      txMock.product.update.mockResolvedValue(mockUpdatedProduct);

      await service.create(inInput, GALLERY_ID, USER_ID);

      expect(emitToGallery).toHaveBeenCalledWith(
        GALLERY_ID,
        'stock:movement',
        expect.objectContaining({
          productId: PRODUCT_ID,
          type: 'IN',
          quantity: 10,
        }),
      );
    });

    it('should not throw when socket emit fails (graceful error handling)', async () => {
      txMock.product.findFirst.mockResolvedValue(mockProduct);
      txMock.stockMovement.create.mockResolvedValue(mockMovement);
      txMock.product.update.mockResolvedValue(mockUpdatedProduct);
      vi.mocked(emitToGallery).mockImplementation(() => {
        throw new Error('socket disconnected');
      });

      await expect(service.create(inInput, GALLERY_ID, USER_ID)).resolves.toBeDefined();
    });
  });

  // ---------------------------------------------------------------- //
  // create — OUT
  // ---------------------------------------------------------------- //
  describe('create (OUT)', () => {
    const outInput = {
      productId: PRODUCT_ID,
      type: 'OUT' as const,
      quantity: 20,
      note: 'Sold',
    };

    it('should create an OUT movement when stock is sufficient', async () => {
      txMock.product.findFirst.mockResolvedValue({ ...mockProduct, currentStock: 50 });
      txMock.stockMovement.create.mockResolvedValue({
        ...mockMovement,
        type: 'OUT',
        quantity: 20,
      });
      txMock.product.update.mockResolvedValue({ ...mockUpdatedProduct, currentStock: 30 });

      const result = await service.create(outInput, GALLERY_ID, USER_ID);

      expect(result.movement.type).toBe('OUT');
    });

    it('should use decrement operation for OUT movements', async () => {
      txMock.product.findFirst.mockResolvedValue({ ...mockProduct, currentStock: 50 });
      txMock.stockMovement.create.mockResolvedValue({
        ...mockMovement,
        type: 'OUT',
        quantity: 20,
      });
      txMock.product.update.mockResolvedValue({ ...mockProduct, currentStock: 30 });

      await service.create(outInput, GALLERY_ID, USER_ID);

      expect(txMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { currentStock: { decrement: 20 } },
        }),
      );
    });

    it('should throw BadRequestError when requested quantity exceeds current stock', async () => {
      txMock.product.findFirst.mockResolvedValue({ ...mockProduct, currentStock: 5 });

      await expect(service.create(outInput, GALLERY_ID, USER_ID)).rejects.toThrow(BadRequestError);
    });

    it('should include current and requested stock in the BadRequestError message', async () => {
      txMock.product.findFirst.mockResolvedValue({ ...mockProduct, currentStock: 5 });

      await expect(service.create(outInput, GALLERY_ID, USER_ID)).rejects.toThrow('5');
    });

    it('should allow OUT when quantity exactly equals current stock (boundary)', async () => {
      txMock.product.findFirst.mockResolvedValue({ ...mockProduct, currentStock: 20 });
      txMock.stockMovement.create.mockResolvedValue({
        ...mockMovement,
        type: 'OUT',
        quantity: 20,
      });
      txMock.product.update.mockResolvedValue({ ...mockProduct, currentStock: 0 });

      await expect(service.create(outInput, GALLERY_ID, USER_ID)).resolves.toBeDefined();
    });

    it('should throw inside the transaction when insufficient stock is detected', async () => {
      // The stock check is now inside the transaction — tx IS called but throws internally.
      txMock.product.findFirst.mockResolvedValue({ ...mockProduct, currentStock: 5 });

      await expect(service.create(outInput, GALLERY_ID, USER_ID)).rejects.toThrow();
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------- //
  // create — ADJUSTMENT
  // ---------------------------------------------------------------- //
  describe('create (ADJUSTMENT)', () => {
    const adjustInput = {
      productId: PRODUCT_ID,
      type: 'ADJUSTMENT' as const,
      quantity: 100,
      note: 'Physical count correction',
    };

    it('should create an ADJUSTMENT movement', async () => {
      txMock.product.findFirst.mockResolvedValue(mockProduct);
      txMock.stockMovement.create.mockResolvedValue({
        ...mockMovement,
        type: 'ADJUSTMENT',
        quantity: 100,
      });
      txMock.product.update.mockResolvedValue({ ...mockProduct, currentStock: 100 });

      const result = await service.create(adjustInput, GALLERY_ID, USER_ID);

      expect(result.movement.type).toBe('ADJUSTMENT');
    });

    it('should set currentStock to exact quantity for ADJUSTMENT', async () => {
      txMock.product.findFirst.mockResolvedValue(mockProduct);
      txMock.stockMovement.create.mockResolvedValue({
        ...mockMovement,
        type: 'ADJUSTMENT',
        quantity: 100,
      });
      txMock.product.update.mockResolvedValue({ ...mockProduct, currentStock: 100 });

      await service.create(adjustInput, GALLERY_ID, USER_ID);

      expect(txMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { currentStock: 100 },
        }),
      );
    });

    it('should allow ADJUSTMENT even when current stock would be insufficient for OUT', async () => {
      // ADJUSTMENT has no stock check — it can set stock to any value
      txMock.product.findFirst.mockResolvedValue({ ...mockProduct, currentStock: 0 });
      txMock.stockMovement.create.mockResolvedValue({
        ...mockMovement,
        type: 'ADJUSTMENT',
        quantity: 500,
      });
      txMock.product.update.mockResolvedValue({ ...mockProduct, currentStock: 500 });

      await expect(service.create(adjustInput, GALLERY_ID, USER_ID)).resolves.toBeDefined();
    });
  });

  // ---------------------------------------------------------------- //
  // delete
  // ---------------------------------------------------------------- //
  describe('delete', () => {
    it('should delete the movement and return its id', async () => {
      txMock.stockMovement.findFirst.mockResolvedValue({
        ...mockMovement,
        type: 'IN',
        product: mockProduct,
      } as any);
      txMock.stockMovement.delete.mockResolvedValue(mockMovement);
      txMock.product.update.mockResolvedValue(mockProduct);

      const result = await service.delete(MOVEMENT_ID, GALLERY_ID);

      expect(result).toEqual({ id: MOVEMENT_ID });
    });

    it('should throw NotFoundError when movement does not exist', async () => {
      txMock.stockMovement.findFirst.mockResolvedValue(null);

      await expect(service.delete('bad-id', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include the movement ID in the NotFoundError message when missing', async () => {
      txMock.stockMovement.findFirst.mockResolvedValue(null);

      await expect(service.delete('missing-movement-id', GALLERY_ID)).rejects.toThrow(
        'missing-movement-id',
      );
    });

    it('should throw NotFoundError when movement product belongs to a different gallery (tenant isolation)', async () => {
      // findFirst with compound { id, product: { galleryId } } returns null when gallery mismatches
      txMock.stockMovement.findFirst.mockResolvedValue(null);

      await expect(service.delete(MOVEMENT_ID, GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should throw from inside the transaction when gallery mismatch is detected', async () => {
      // findFirst inside tx returns null for mismatched gallery
      txMock.stockMovement.findFirst.mockResolvedValue(null);

      await expect(service.delete(MOVEMENT_ID, GALLERY_ID)).rejects.toThrow(NotFoundError);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should reverse an IN movement by decrementing stock', async () => {
      txMock.stockMovement.findFirst.mockResolvedValue({
        ...mockMovement,
        type: 'IN',
        quantity: 10,
        product: mockProduct,
      } as any);
      txMock.stockMovement.delete.mockResolvedValue(mockMovement);
      txMock.product.update.mockResolvedValue(mockProduct);

      await service.delete(MOVEMENT_ID, GALLERY_ID);

      expect(txMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { currentStock: { decrement: 10 } },
        }),
      );
    });

    it('should reverse an OUT movement by incrementing stock', async () => {
      txMock.stockMovement.findFirst.mockResolvedValue({
        ...mockMovement,
        type: 'OUT',
        quantity: 15,
        product: mockProduct,
      } as any);
      txMock.stockMovement.delete.mockResolvedValue(mockMovement);
      txMock.product.update.mockResolvedValue(mockProduct);

      await service.delete(MOVEMENT_ID, GALLERY_ID);

      expect(txMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { currentStock: { increment: 15 } },
        }),
      );
    });

    it('should recalculate stock from remaining movements when deleting an ADJUSTMENT', async () => {
      txMock.stockMovement.findFirst.mockResolvedValue({
        ...mockMovement,
        type: 'ADJUSTMENT',
        quantity: 100,
        product: mockProduct,
      } as any);

      // Remaining movements after the ADJUSTMENT is deleted: IN 20, OUT 5
      txMock.stockMovement.findMany.mockResolvedValue([
        { type: 'IN', quantity: 20 },
        { type: 'OUT', quantity: 5 },
      ]);
      txMock.stockMovement.delete.mockResolvedValue(mockMovement);
      txMock.product.update.mockResolvedValue(mockProduct);

      await service.delete(MOVEMENT_ID, GALLERY_ID);

      // Expected recalculated stock: IN 20 - OUT 5 = 15
      expect(txMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { currentStock: 15 },
        }),
      );
    });

    it('should set stock to 0 when no remaining movements exist after deleting an ADJUSTMENT', async () => {
      txMock.stockMovement.findFirst.mockResolvedValue({
        ...mockMovement,
        type: 'ADJUSTMENT',
        quantity: 100,
        product: mockProduct,
      } as any);
      txMock.stockMovement.findMany.mockResolvedValue([]);
      txMock.stockMovement.delete.mockResolvedValue(mockMovement);
      txMock.product.update.mockResolvedValue(mockProduct);

      await service.delete(MOVEMENT_ID, GALLERY_ID);

      expect(txMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { currentStock: 0 },
        }),
      );
    });

    it('should delete movement record within the transaction', async () => {
      txMock.stockMovement.findFirst.mockResolvedValue({
        ...mockMovement,
        type: 'IN',
        quantity: 10,
        product: mockProduct,
      } as any);
      txMock.stockMovement.delete.mockResolvedValue(mockMovement);
      txMock.product.update.mockResolvedValue(mockProduct);

      await service.delete(MOVEMENT_ID, GALLERY_ID);

      expect(txMock.stockMovement.delete).toHaveBeenCalledWith({
        where: { id: MOVEMENT_ID },
      });
    });
  });

  // ---------------------------------------------------------------- //
  // getRecent
  // ---------------------------------------------------------------- //
  describe('getRecent', () => {
    it('should return recent movements filtered by gallery', async () => {
      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([mockMovement] as any);

      const result = await service.getRecent(GALLERY_ID);

      expect(result).toHaveLength(1);
    });

    it('should default limit to 10 when not specified', async () => {
      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([]);

      await service.getRecent(GALLERY_ID);

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });

    it('should use the provided limit when specified', async () => {
      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([]);

      await service.getRecent(GALLERY_ID, 5);

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it('should filter by gallery via the product relation for tenant isolation', async () => {
      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([]);

      await service.getRecent(GALLERY_ID);

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { product: { galleryId: GALLERY_ID } },
        }),
      );
    });

    it('should order results by createdAt descending', async () => {
      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([]);

      await service.getRecent(GALLERY_ID);

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });

    it('should include product name and id in results', async () => {
      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([]);

      await service.getRecent(GALLERY_ID);

      const call = vi.mocked(prisma.stockMovement.findMany).mock.calls[0][0] as any;
      expect(call.include.product.select).toMatchObject({ id: true, name: true });
    });
  });
});
