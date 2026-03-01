// Stock Alert service tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { stockAlertService } from '../stockAlert.service';
import prisma from '../../lib/prisma';

vi.mock('../../lib/prisma', () => ({
  default: {
    product: {
      findMany: vi.fn(),
    },
    gallery: {
      findUnique: vi.fn(),
    },
    platformNotification: {
      create: vi.fn(),
    },
  },
}));

describe('StockAlertService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLowStockProducts', () => {
    it('should return products with currentStock < minStockLevel', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product A',
          currentStock: 5,
          minStockLevel: 10,
        },
        {
          id: '2',
          name: 'Product B',
          currentStock: 20,
          minStockLevel: 10,
        },
        {
          id: '3',
          name: 'Product C',
          currentStock: 2,
          minStockLevel: 15,
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const result = await stockAlertService.getLowStockProducts('gallery-1');

      expect(result).toHaveLength(2);
      expect(result[0].deficit).toBe(13); // Product C: 15-2
      expect(result[1].deficit).toBe(5); // Product A: 10-5
    });

    it('should return empty array when no low stock products', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product A',
          currentStock: 20,
          minStockLevel: 10,
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const result = await stockAlertService.getLowStockProducts('gallery-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('checkAndAlert', () => {
    it('should return alerted=false when no low stock products', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      const result = await stockAlertService.checkAndAlert('gallery-1');

      expect(result.alerted).toBe(false);
      expect(result.count).toBe(0);
      expect(prisma.platformNotification.create).not.toHaveBeenCalled();
    });

    it('should create notification when low stock products exist', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product A',
          currentStock: 5,
          minStockLevel: 10,
        },
      ];

      const mockGallery = {
        id: 'gallery-1',
        name: 'Test Gallery',
      };

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);
      vi.mocked(prisma.platformNotification.create).mockResolvedValue({} as any);

      const result = await stockAlertService.checkAndAlert('gallery-1');

      expect(result.alerted).toBe(true);
      expect(result.count).toBe(1);
      expect(prisma.platformNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'GENERAL_ANNOUNCEMENT',
          priority: 'HIGH',
          targetType: 'GALLERY',
          targetIds: ['gallery-1'],
        }),
      });
    });
  });
});
