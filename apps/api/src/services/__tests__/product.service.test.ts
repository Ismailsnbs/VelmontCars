import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from '../product.service';
import { NotFoundError, BadRequestError } from '../../middleware/error.middleware';

// ------------------------------------------------------------------ //
// Prisma mock
// ------------------------------------------------------------------ //

const { productMock } = vi.hoisted(() => {
  const mock = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  };
  return { productMock: mock };
});

vi.mock('../../lib/prisma', () => ({
  default: {
    product: productMock,
    $transaction: vi.fn((fn: any) => fn({ product: productMock })),
  },
}));

import prisma from '../../lib/prisma';

// ------------------------------------------------------------------ //
// Fixtures
// ------------------------------------------------------------------ //

const GALLERY_ID = 'gallery-aaa-111';
const OTHER_GALLERY_ID = 'gallery-bbb-222';
const PRODUCT_ID = 'product-ccc-333';

const mockProduct = {
  id: PRODUCT_ID,
  name: 'Engine Oil',
  category: 'CHEMICAL',
  unit: 'litre',
  unitPrice: 150,
  minStockLevel: 10,
  currentStock: 50,
  barcode: 'BAR001',
  description: 'Synthetic engine oil',
  galleryId: GALLERY_ID,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  movements: [],
};

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProductService();
  });

  // ---------------------------------------------------------------- //
  // getAll
  // ---------------------------------------------------------------- //
  describe('getAll', () => {
    const baseParams = {
      galleryId: GALLERY_ID,
      page: 1,
      limit: 20,
      skip: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    };

    it('should return paginated products for the given gallery', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      const result = await service.getAll(baseParams);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(PRODUCT_ID);
    });

    it('should pass galleryId in the where clause for tenant isolation', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      await service.getAll(baseParams);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ galleryId: GALLERY_ID }),
        }),
      );
    });

    it('should filter by category when provided', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      await service.getAll({ ...baseParams, category: 'CHEMICAL' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'CHEMICAL' }),
        }),
      );
    });

    it('should add OR search clause when search is provided', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      await service.getAll({ ...baseParams, search: 'oil' });

      const call = vi.mocked(prisma.product.findMany).mock.calls[0][0] as any;
      expect(call.where.OR).toBeDefined();
    });

    it('should filter products below minimum stock level in memory', async () => {
      const lowStockProduct = { ...mockProduct, currentStock: 5, minStockLevel: 10 };
      const normalProduct = { ...mockProduct, id: 'other', currentStock: 20, minStockLevel: 10 };
      vi.mocked(prisma.product.findMany).mockResolvedValue([lowStockProduct, normalProduct] as any);

      const result = await service.getAll({ ...baseParams, belowMinStock: true });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].currentStock).toBe(5);
    });

    it('should return all products when belowMinStock is not set', async () => {
      const products = [
        { ...mockProduct, currentStock: 5 },
        { ...mockProduct, id: 'p2', currentStock: 20 },
      ];
      vi.mocked(prisma.product.findMany).mockResolvedValue(products as any);
      vi.mocked(prisma.product.count).mockResolvedValue(2);

      const result = await service.getAll(baseParams);

      expect(result.total).toBe(2);
    });

    it('should apply DB-level pagination with skip/take', async () => {
      // DB-level pagination: findMany returns already-paginated data, count returns total
      const paginatedProducts = [
        { ...mockProduct, id: 'p-0' },
        { ...mockProduct, id: 'p-1' },
      ];
      vi.mocked(prisma.product.findMany).mockResolvedValue(paginatedProducts as any);
      vi.mocked(prisma.product.count).mockResolvedValue(5);

      const result = await service.getAll({ ...baseParams, limit: 2, skip: 0 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(5);
    });

    it('should return empty data when no products exist for the gallery', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      const result = await service.getAll(baseParams);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ---------------------------------------------------------------- //
  // getById
  // ---------------------------------------------------------------- //
  describe('getById', () => {
    it('should return the product when it belongs to the gallery', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(mockProduct as any);

      const result = await service.getById(PRODUCT_ID, GALLERY_ID);

      expect(result.id).toBe(PRODUCT_ID);
    });

    it('should throw NotFoundError when product does not exist', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(service.getById('bad-id', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include the product ID in the NotFoundError message when product is missing', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(service.getById('missing-product-id', GALLERY_ID)).rejects.toThrow(
        'missing-product-id',
      );
    });

    it('should throw NotFoundError when product belongs to a different gallery (tenant isolation)', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(service.getById(PRODUCT_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include movements in the returned product', async () => {
      const productWithMovements = {
        ...mockProduct,
        movements: [{ id: 'mov-1', type: 'IN', quantity: 10 }],
      };
      vi.mocked(prisma.product.findFirst).mockResolvedValue(productWithMovements as any);

      const result = await service.getById(PRODUCT_ID, GALLERY_ID);

      expect(result.movements).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------- //
  // create
  // ---------------------------------------------------------------- //
  describe('create', () => {
    const createInput = {
      name: 'Engine Oil',
      category: 'CHEMICAL' as const,
      unit: 'litre',
      unitPrice: 150,
      minStockLevel: 10,
      barcode: 'BAR001',
      description: 'Synthetic engine oil',
    };

    it('should create and return the new product', async () => {
      vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);

      const result = await service.create(createInput, GALLERY_ID);

      expect(result).toEqual(mockProduct);
    });

    it('should pass galleryId to the created product', async () => {
      vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);

      await service.create(createInput, GALLERY_ID);

      const call = vi.mocked(prisma.product.create).mock.calls[0][0] as any;
      expect(call.data.galleryId).toBe(GALLERY_ID);
    });

    it('should initialise currentStock to 0 on creation', async () => {
      vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);

      await service.create(createInput, GALLERY_ID);

      const call = vi.mocked(prisma.product.create).mock.calls[0][0] as any;
      expect(call.data.currentStock).toBe(0);
    });

    it('should default minStockLevel to 0 when not provided', async () => {
      const inputWithoutMinStock = { ...createInput };
      delete (inputWithoutMinStock as any).minStockLevel;
      vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);

      await service.create(inputWithoutMinStock, GALLERY_ID);

      const call = vi.mocked(prisma.product.create).mock.calls[0][0] as any;
      expect(call.data.minStockLevel).toBe(0);
    });

    it('should use the provided minStockLevel when given', async () => {
      vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);

      await service.create({ ...createInput, minStockLevel: 25 }, GALLERY_ID);

      const call = vi.mocked(prisma.product.create).mock.calls[0][0] as any;
      expect(call.data.minStockLevel).toBe(25);
    });

    it('should persist optional barcode when provided', async () => {
      vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);

      await service.create(createInput, GALLERY_ID);

      const call = vi.mocked(prisma.product.create).mock.calls[0][0] as any;
      expect(call.data.barcode).toBe('BAR001');
    });
  });

  // ---------------------------------------------------------------- //
  // update
  // ---------------------------------------------------------------- //
  describe('update', () => {
    const updateInput = {
      name: 'Premium Engine Oil',
      unitPrice: 200,
    };

    it('should update and return the modified product', async () => {
      const updatedProduct = { ...mockProduct, name: 'Premium Engine Oil', unitPrice: 200 };
      vi.mocked(prisma.product.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.product.findFirst).mockResolvedValue(updatedProduct as any);

      const result = await service.update(PRODUCT_ID, updateInput, GALLERY_ID);

      expect(result!.name).toBe('Premium Engine Oil');
    });

    it('should throw NotFoundError when product does not exist', async () => {
      vi.mocked(prisma.product.updateMany).mockResolvedValue({ count: 0 });

      await expect(service.update('bad-id', updateInput, GALLERY_ID)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should include the product ID in the NotFoundError message when product is missing', async () => {
      vi.mocked(prisma.product.updateMany).mockResolvedValue({ count: 0 });

      await expect(service.update('missing-id', updateInput, GALLERY_ID)).rejects.toThrow(
        'missing-id',
      );
    });

    it('should throw NotFoundError when product belongs to a different gallery (tenant isolation)', async () => {
      vi.mocked(prisma.product.updateMany).mockResolvedValue({ count: 0 });

      await expect(service.update(PRODUCT_ID, updateInput, OTHER_GALLERY_ID)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should not call findFirst when updateMany returns count 0 (no rows matched)', async () => {
      vi.mocked(prisma.product.updateMany).mockResolvedValue({ count: 0 });

      await expect(service.update(PRODUCT_ID, updateInput, OTHER_GALLERY_ID)).rejects.toThrow();
      // findFirst is only reached after a successful updateMany — no calls when count === 0
      expect(prisma.product.findFirst).not.toHaveBeenCalled();
    });

    it('should call updateMany with galleryId in the where clause (write-path tenant isolation)', async () => {
      vi.mocked(prisma.product.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.product.findFirst).mockResolvedValue(mockProduct as any);

      await service.update(PRODUCT_ID, updateInput, GALLERY_ID);

      expect(prisma.product.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: PRODUCT_ID, galleryId: GALLERY_ID }),
        }),
      );
    });

    it('should apply only the fields present in the input (partial update)', async () => {
      vi.mocked(prisma.product.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.product.findFirst).mockResolvedValue(mockProduct as any);

      await service.update(PRODUCT_ID, { name: 'New Name' }, GALLERY_ID);

      const call = vi.mocked(prisma.product.updateMany).mock.calls[0][0] as any;
      expect(call.data.name).toBe('New Name');
      expect(call.data.category).toBeUndefined();
    });

    it('should update unitPrice when provided', async () => {
      vi.mocked(prisma.product.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.product.findFirst).mockResolvedValue(mockProduct as any);

      await service.update(PRODUCT_ID, { unitPrice: 999 }, GALLERY_ID);

      const call = vi.mocked(prisma.product.updateMany).mock.calls[0][0] as any;
      expect(call.data.unitPrice).toBe(999);
    });

    it('should update minStockLevel to 0 when explicitly set', async () => {
      vi.mocked(prisma.product.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.product.findFirst).mockResolvedValue(mockProduct as any);

      await service.update(PRODUCT_ID, { minStockLevel: 0 }, GALLERY_ID);

      const call = vi.mocked(prisma.product.updateMany).mock.calls[0][0] as any;
      expect(call.data.minStockLevel).toBe(0);
    });
  });

  // ---------------------------------------------------------------- //
  // delete
  // ---------------------------------------------------------------- //
  describe('delete', () => {
    it('should delete the product and return its id when no movements exist', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue({
        ...mockProduct,
        movements: [],
      } as any);
      vi.mocked(prisma.product.deleteMany).mockResolvedValue({ count: 1 });

      const result = await service.delete(PRODUCT_ID, GALLERY_ID);

      expect(result).toEqual({ id: PRODUCT_ID });
    });

    it('should throw NotFoundError when product does not exist', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(service.delete('bad-id', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include the product ID in the NotFoundError message when product is missing', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(service.delete('missing-id', GALLERY_ID)).rejects.toThrow('missing-id');
    });

    it('should throw NotFoundError when product belongs to a different gallery (tenant isolation)', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(service.delete(PRODUCT_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when product has existing stock movements', async () => {
      const productWithMovements = {
        ...mockProduct,
        movements: [{ id: 'mov-1' }, { id: 'mov-2' }],
      };
      vi.mocked(prisma.product.findFirst).mockResolvedValue(productWithMovements as any);

      await expect(service.delete(PRODUCT_ID, GALLERY_ID)).rejects.toThrow(BadRequestError);
    });

    it('should include movement count in the BadRequestError message', async () => {
      const productWithMovements = {
        ...mockProduct,
        movements: [{ id: 'mov-1' }, { id: 'mov-2' }, { id: 'mov-3' }],
      };
      vi.mocked(prisma.product.findFirst).mockResolvedValue(productWithMovements as any);

      await expect(service.delete(PRODUCT_ID, GALLERY_ID)).rejects.toThrow('3');
    });

    it('should not call prisma.product.deleteMany when product has movements', async () => {
      const productWithMovements = {
        ...mockProduct,
        movements: [{ id: 'mov-1' }],
      };
      vi.mocked(prisma.product.findFirst).mockResolvedValue(productWithMovements as any);

      await expect(service.delete(PRODUCT_ID, GALLERY_ID)).rejects.toThrow();
      expect(prisma.product.deleteMany).not.toHaveBeenCalled();
    });

    it('should call prisma.product.deleteMany with both id and galleryId (write-path tenant isolation)', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue({
        ...mockProduct,
        movements: [],
      } as any);
      vi.mocked(prisma.product.deleteMany).mockResolvedValue({ count: 1 });

      await service.delete(PRODUCT_ID, GALLERY_ID);

      expect(prisma.product.deleteMany).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID, galleryId: GALLERY_ID },
      });
    });
  });

  // ---------------------------------------------------------------- //
  // getStats
  // ---------------------------------------------------------------- //
  describe('getStats', () => {
    it('should return total product count for the gallery', async () => {
      vi.mocked(prisma.product.count).mockResolvedValue(1);
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);

      const result = await service.getStats(GALLERY_ID);

      expect(result.totalProducts).toBe(1);
    });

    it('should count products below minimum stock level', async () => {
      const products = [
        { ...mockProduct, currentStock: 5, minStockLevel: 10 },  // below
        { ...mockProduct, id: 'p2', currentStock: 20, minStockLevel: 10 }, // above
        { ...mockProduct, id: 'p3', currentStock: 10, minStockLevel: 10 }, // equal (not below)
      ];
      vi.mocked(prisma.product.count).mockResolvedValue(3);
      vi.mocked(prisma.product.findMany).mockResolvedValue(products as any);

      const result = await service.getStats(GALLERY_ID);

      expect(result.belowMinStockCount).toBe(1);
    });

    it('should compute category statistics grouped by category name', async () => {
      const products = [
        { ...mockProduct, category: 'CHEMICAL' },
        { ...mockProduct, id: 'p2', category: 'CHEMICAL' },
        { ...mockProduct, id: 'p3', category: 'CLEANING' },
      ];
      vi.mocked(prisma.product.count).mockResolvedValue(3);
      vi.mocked(prisma.product.findMany).mockResolvedValue(products as any);

      const result = await service.getStats(GALLERY_ID);

      expect(result.categoryStats['CHEMICAL']).toBe(2);
      expect(result.categoryStats['CLEANING']).toBe(1);
    });

    it('should calculate total stock value as currentStock * unitPrice sum', async () => {
      const products = [
        { ...mockProduct, currentStock: 10, unitPrice: 100 }, // 1000
        { ...mockProduct, id: 'p2', currentStock: 5, unitPrice: 200 }, // 1000
      ];
      vi.mocked(prisma.product.count).mockResolvedValue(2);
      vi.mocked(prisma.product.findMany).mockResolvedValue(products as any);

      const result = await service.getStats(GALLERY_ID);

      expect(result.totalStockValue).toBe(2000);
    });

    it('should return zeroes when gallery has no products', async () => {
      vi.mocked(prisma.product.count).mockResolvedValue(0);
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      const result = await service.getStats(GALLERY_ID);

      expect(result.totalProducts).toBe(0);
      expect(result.belowMinStockCount).toBe(0);
      expect(result.totalStockValue).toBe(0);
      expect(result.categoryStats).toEqual({});
    });

    it('should filter products by galleryId for tenant isolation', async () => {
      vi.mocked(prisma.product.count).mockResolvedValue(0);
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      await service.getStats(GALLERY_ID);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { galleryId: GALLERY_ID },
        select: {
          currentStock: true,
          minStockLevel: true,
          category: true,
          unitPrice: true,
        },
      });
    });
  });

  // ---------------------------------------------------------------- //
  // checkStockLevel
  // ---------------------------------------------------------------- //
  describe('checkStockLevel', () => {
    it('should return true when currentStock is below minStockLevel', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue({
        ...mockProduct,
        currentStock: 5,
        minStockLevel: 10,
      } as any);

      const result = await service.checkStockLevel(PRODUCT_ID, GALLERY_ID);

      expect(result).toBe(true);
    });

    it('should return false when currentStock equals minStockLevel', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue({
        ...mockProduct,
        currentStock: 10,
        minStockLevel: 10,
      } as any);

      const result = await service.checkStockLevel(PRODUCT_ID, GALLERY_ID);

      expect(result).toBe(false);
    });

    it('should return false when currentStock is above minStockLevel', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue({
        ...mockProduct,
        currentStock: 20,
        minStockLevel: 10,
      } as any);

      const result = await service.checkStockLevel(PRODUCT_ID, GALLERY_ID);

      expect(result).toBe(false);
    });

    it('should throw NotFoundError when product does not exist', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(service.checkStockLevel('bad-id', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when product belongs to a different gallery (tenant isolation)', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(service.checkStockLevel(PRODUCT_ID, OTHER_GALLERY_ID)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
