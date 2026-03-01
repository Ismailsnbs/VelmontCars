import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { VehicleExpenseService } from '../vehicleExpense.service';
import { NotFoundError } from '../../middleware/error.middleware';

// ------------------------------------------------------------------ //
// Mocks
// ------------------------------------------------------------------ //

vi.mock('../../lib/prisma', () => ({
  default: {
    vehicle: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    vehicleExpense: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

import prisma from '../../lib/prisma';

// ------------------------------------------------------------------ //
// Fixtures
// ------------------------------------------------------------------ //

const GALLERY_ID = 'gallery-1';
const OTHER_GALLERY_ID = 'gallery-other';
const VEHICLE_ID = 'vehicle-1';
const EXPENSE_ID = 'expense-1';

const mockVehicle = {
  id: VEHICLE_ID,
  galleryId: GALLERY_ID,
  brand: 'Toyota',
  model: 'Corolla',
  additionalExpenses: new Prisma.Decimal(0),
};

const mockExpense = {
  id: EXPENSE_ID,
  vehicleId: VEHICLE_ID,
  type: 'REPAIR',
  amount: new Prisma.Decimal(500),
  description: 'Motor tamiri',
  date: new Date('2024-06-01'),
  createdBy: 'user@test.com',
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date('2024-06-01'),
};

// Expense enriched with its vehicle relation — used by update/delete lookups
const mockExpenseWithVehicle = {
  ...mockExpense,
  vehicle: {
    id: VEHICLE_ID,
    galleryId: GALLERY_ID,
  },
};

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //

describe('VehicleExpenseService', () => {
  let service: VehicleExpenseService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new VehicleExpenseService();
  });

  // ---------------------------------------------------------------- //
  // getByVehicleId
  // ---------------------------------------------------------------- //
  describe('getByVehicleId', () => {
    it('should return expenses for a valid vehicle scoped to the gallery', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleExpense.findMany).mockResolvedValue([mockExpense] as any);

      const result = await service.getByVehicleId(VEHICLE_ID, GALLERY_ID);

      expect(result).toEqual([mockExpense]);
    });

    it('should scope the vehicle lookup to both vehicleId and galleryId', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleExpense.findMany).mockResolvedValue([]);

      await service.getByVehicleId(VEHICLE_ID, GALLERY_ID);

      expect(prisma.vehicle.findFirst).toHaveBeenCalledWith({
        where: { id: VEHICLE_ID, galleryId: GALLERY_ID },
      });
    });

    it('should throw NotFoundError when vehicle does not exist', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getByVehicleId('bad-vehicle', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when vehicle belongs to a different gallery (tenant isolation)', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getByVehicleId(VEHICLE_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should not query expenses when vehicle lookup fails', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getByVehicleId(VEHICLE_ID, GALLERY_ID)).rejects.toThrow();
      expect(prisma.vehicleExpense.findMany).not.toHaveBeenCalled();
    });

    it('should include the vehicleId in the NotFoundError message', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getByVehicleId('missing-id', GALLERY_ID)).rejects.toThrow('missing-id');
    });

    it('should order expenses by date descending', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleExpense.findMany).mockResolvedValue([]);

      await service.getByVehicleId(VEHICLE_ID, GALLERY_ID);

      expect(prisma.vehicleExpense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { date: 'desc' } }),
      );
    });

    it('should filter expenses by vehicleId', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleExpense.findMany).mockResolvedValue([]);

      await service.getByVehicleId(VEHICLE_ID, GALLERY_ID);

      expect(prisma.vehicleExpense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { vehicleId: VEHICLE_ID } }),
      );
    });

    it('should return an empty array when the vehicle has no expenses', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleExpense.findMany).mockResolvedValue([]);

      const result = await service.getByVehicleId(VEHICLE_ID, GALLERY_ID);

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------- //
  // create
  // ---------------------------------------------------------------- //
  describe('create', () => {
    const createInput = {
      type: 'REPAIR' as const,
      amount: 500,
      description: 'Motor tamiri',
      date: '2024-06-01T00:00:00.000Z',
      createdBy: 'user@test.com',
    };

    it('should create and return the new expense', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleExpense.create).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(500) },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      const result = await service.create(createInput, VEHICLE_ID, GALLERY_ID);

      expect(result).toEqual(mockExpense);
    });

    it('should throw NotFoundError when vehicle does not exist during create', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.create(createInput, 'bad-vehicle', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when vehicle belongs to a different gallery (tenant isolation)', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.create(createInput, VEHICLE_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should not call prisma.vehicleExpense.create when vehicle lookup fails', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.create(createInput, VEHICLE_ID, GALLERY_ID)).rejects.toThrow();
      expect(prisma.vehicleExpense.create).not.toHaveBeenCalled();
    });

    it('should convert amount to Prisma.Decimal when persisting', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleExpense.create).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(500) },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.create(createInput, VEHICLE_ID, GALLERY_ID);

      const call = vi.mocked(prisma.vehicleExpense.create).mock.calls[0][0] as any;
      expect(call.data.amount).toBeInstanceOf(Prisma.Decimal);
      expect(call.data.amount.toString()).toBe('500');
    });

    it('should default date to now when no date is provided in the input', async () => {
      const inputWithoutDate = { type: 'REPAIR' as const, amount: 200 };
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleExpense.create).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: null },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      const before = new Date();
      await service.create(inputWithoutDate, VEHICLE_ID, GALLERY_ID);
      const after = new Date();

      const call = vi.mocked(prisma.vehicleExpense.create).mock.calls[0][0] as any;
      const savedDate: Date = call.data.date;
      expect(savedDate).toBeInstanceOf(Date);
      expect(savedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(savedDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should parse the provided date string to a Date object', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleExpense.create).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(500) },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.create(createInput, VEHICLE_ID, GALLERY_ID);

      const call = vi.mocked(prisma.vehicleExpense.create).mock.calls[0][0] as any;
      expect(call.data.date).toBeInstanceOf(Date);
    });

    it('should recalculate and update vehicle additionalExpenses after creating expense', async () => {
      const aggregatedTotal = new Prisma.Decimal(1500);
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleExpense.create).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: aggregatedTotal },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.create(createInput, VEHICLE_ID, GALLERY_ID);

      expect(prisma.vehicleExpense.aggregate).toHaveBeenCalledWith({
        where: { vehicleId: VEHICLE_ID },
        _sum: { amount: true },
      });
      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: VEHICLE_ID },
        data: { additionalExpenses: aggregatedTotal },
      });
    });

    it('should set additionalExpenses to Decimal(0) when aggregate returns null sum', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleExpense.create).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: null },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.create(createInput, VEHICLE_ID, GALLERY_ID);

      const call = vi.mocked(prisma.vehicle.update).mock.calls[0][0] as any;
      expect(call.data.additionalExpenses).toEqual(new Prisma.Decimal(0));
    });
  });

  // ---------------------------------------------------------------- //
  // update
  // ---------------------------------------------------------------- //
  describe('update', () => {
    const updateInput = {
      type: 'PAINT' as const,
      amount: 750,
      description: 'Boya yenileme',
    };

    it('should update and return the modified expense', async () => {
      const updatedExpense = { ...mockExpense, type: 'PAINT', amount: new Prisma.Decimal(750) };
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(mockExpenseWithVehicle as any);
      vi.mocked(prisma.vehicleExpense.update).mockResolvedValue(updatedExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(750) },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      const result = await service.update(EXPENSE_ID, updateInput, GALLERY_ID);

      expect(result).toEqual(updatedExpense);
    });

    it('should throw NotFoundError when expense does not exist', async () => {
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(null);

      await expect(service.update('bad-expense', updateInput, GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include the expenseId in the NotFoundError message when expense is missing', async () => {
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(null);

      await expect(service.update('missing-expense', updateInput, GALLERY_ID)).rejects.toThrow(
        'missing-expense',
      );
    });

    it('should throw NotFoundError when expense belongs to a different gallery (tenant isolation)', async () => {
      const wrongGalleryExpense = {
        ...mockExpenseWithVehicle,
        vehicle: { id: VEHICLE_ID, galleryId: OTHER_GALLERY_ID },
      };
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(wrongGalleryExpense as any);

      await expect(service.update(EXPENSE_ID, updateInput, GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should not call prisma.vehicleExpense.update when gallery mismatch is detected', async () => {
      const wrongGalleryExpense = {
        ...mockExpenseWithVehicle,
        vehicle: { id: VEHICLE_ID, galleryId: OTHER_GALLERY_ID },
      };
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(wrongGalleryExpense as any);

      await expect(service.update(EXPENSE_ID, updateInput, GALLERY_ID)).rejects.toThrow();
      expect(prisma.vehicleExpense.update).not.toHaveBeenCalled();
    });

    it('should apply only the fields present in the input (partial update)', async () => {
      const partialInput = { description: 'Sadece aciklama degisti' };
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(mockExpenseWithVehicle as any);
      vi.mocked(prisma.vehicleExpense.update).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(500) },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.update(EXPENSE_ID, partialInput, GALLERY_ID);

      const call = vi.mocked(prisma.vehicleExpense.update).mock.calls[0][0] as any;
      expect(call.data.description).toBe('Sadece aciklama degisti');
      expect(call.data.type).toBeUndefined();
      expect(call.data.amount).toBeUndefined();
    });

    it('should convert amount to Prisma.Decimal when amount is in the update input', async () => {
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(mockExpenseWithVehicle as any);
      vi.mocked(prisma.vehicleExpense.update).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(999) },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.update(EXPENSE_ID, { amount: 999 }, GALLERY_ID);

      const call = vi.mocked(prisma.vehicleExpense.update).mock.calls[0][0] as any;
      expect(call.data.amount).toBeInstanceOf(Prisma.Decimal);
      expect(call.data.amount.toString()).toBe('999');
    });

    it('should parse the date string to a Date object when date is in the update input', async () => {
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(mockExpenseWithVehicle as any);
      vi.mocked(prisma.vehicleExpense.update).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(500) },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.update(EXPENSE_ID, { date: '2025-01-15T00:00:00.000Z' }, GALLERY_ID);

      const call = vi.mocked(prisma.vehicleExpense.update).mock.calls[0][0] as any;
      expect(call.data.date).toBeInstanceOf(Date);
    });

    it('should recalculate and update vehicle additionalExpenses after updating expense', async () => {
      const aggregatedTotal = new Prisma.Decimal(2000);
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(mockExpenseWithVehicle as any);
      vi.mocked(prisma.vehicleExpense.update).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: aggregatedTotal },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.update(EXPENSE_ID, updateInput, GALLERY_ID);

      expect(prisma.vehicleExpense.aggregate).toHaveBeenCalledWith({
        where: { vehicleId: VEHICLE_ID },
        _sum: { amount: true },
      });
      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: VEHICLE_ID },
        data: { additionalExpenses: aggregatedTotal },
      });
    });

    it('should look up the expense with vehicle galleryId included for tenant check', async () => {
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(mockExpenseWithVehicle as any);
      vi.mocked(prisma.vehicleExpense.update).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(500) },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.update(EXPENSE_ID, updateInput, GALLERY_ID);

      expect(prisma.vehicleExpense.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: EXPENSE_ID },
          include: {
            vehicle: {
              select: { id: true, galleryId: true },
            },
          },
        }),
      );
    });
  });

  // ---------------------------------------------------------------- //
  // delete
  // ---------------------------------------------------------------- //
  describe('delete', () => {
    it('should delete the expense and return its id', async () => {
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(mockExpenseWithVehicle as any);
      vi.mocked(prisma.vehicleExpense.delete).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(0) },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      const result = await service.delete(EXPENSE_ID, GALLERY_ID);

      expect(result).toEqual({ id: EXPENSE_ID });
    });

    it('should throw NotFoundError when expense does not exist', async () => {
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(null);

      await expect(service.delete('bad-expense', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include the expenseId in the NotFoundError message when expense is missing', async () => {
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(null);

      await expect(service.delete('missing-expense', GALLERY_ID)).rejects.toThrow('missing-expense');
    });

    it('should throw NotFoundError when expense belongs to a different gallery (tenant isolation)', async () => {
      const wrongGalleryExpense = {
        ...mockExpenseWithVehicle,
        vehicle: { id: VEHICLE_ID, galleryId: OTHER_GALLERY_ID },
      };
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(wrongGalleryExpense as any);

      await expect(service.delete(EXPENSE_ID, GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should not call prisma.vehicleExpense.delete when gallery mismatch is detected', async () => {
      const wrongGalleryExpense = {
        ...mockExpenseWithVehicle,
        vehicle: { id: VEHICLE_ID, galleryId: OTHER_GALLERY_ID },
      };
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(wrongGalleryExpense as any);

      await expect(service.delete(EXPENSE_ID, GALLERY_ID)).rejects.toThrow();
      expect(prisma.vehicleExpense.delete).not.toHaveBeenCalled();
    });

    it('should call prisma.vehicleExpense.delete with the correct expense id', async () => {
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(mockExpenseWithVehicle as any);
      vi.mocked(prisma.vehicleExpense.delete).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(0) },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.delete(EXPENSE_ID, GALLERY_ID);

      expect(prisma.vehicleExpense.delete).toHaveBeenCalledWith({ where: { id: EXPENSE_ID } });
    });

    it('should recalculate and update vehicle additionalExpenses after deleting expense', async () => {
      const aggregatedTotal = new Prisma.Decimal(300);
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(mockExpenseWithVehicle as any);
      vi.mocked(prisma.vehicleExpense.delete).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: aggregatedTotal },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.delete(EXPENSE_ID, GALLERY_ID);

      expect(prisma.vehicleExpense.aggregate).toHaveBeenCalledWith({
        where: { vehicleId: VEHICLE_ID },
        _sum: { amount: true },
      });
      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: VEHICLE_ID },
        data: { additionalExpenses: aggregatedTotal },
      });
    });

    it('should set additionalExpenses to Decimal(0) when aggregate returns null sum after deletion', async () => {
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(mockExpenseWithVehicle as any);
      vi.mocked(prisma.vehicleExpense.delete).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: null },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.delete(EXPENSE_ID, GALLERY_ID);

      const call = vi.mocked(prisma.vehicle.update).mock.calls[0][0] as any;
      expect(call.data.additionalExpenses).toEqual(new Prisma.Decimal(0));
    });

    it('should look up the expense with vehicle galleryId included for tenant check', async () => {
      vi.mocked(prisma.vehicleExpense.findFirst).mockResolvedValue(mockExpenseWithVehicle as any);
      vi.mocked(prisma.vehicleExpense.delete).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.vehicleExpense.aggregate).mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(0) },
      } as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.delete(EXPENSE_ID, GALLERY_ID);

      expect(prisma.vehicleExpense.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: EXPENSE_ID },
          include: {
            vehicle: {
              select: { id: true, galleryId: true },
            },
          },
        }),
      );
    });
  });
});
