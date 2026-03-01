import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxRateService } from '../taxRate.service';
import { NotFoundError } from '../../middleware/error.middleware';

// ------------------------------------------------------------------ //
// Mocks
// ------------------------------------------------------------------ //

vi.mock('../../lib/prisma', () => ({
  default: {
    taxRate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    taxRateHistory: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../audit.service', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

import prisma from '../../lib/prisma';
import { auditService } from '../audit.service';

// ------------------------------------------------------------------ //
// Fixtures
// ------------------------------------------------------------------ //

const mockTaxRate = {
  id: 'taxrate-1',
  code: 'KDV20',
  name: 'KDV %20',
  nameEn: 'VAT 20%',
  rate: 20,
  rateType: 'PERCENTAGE',
  vehicleType: 'PASSENGER',
  minEngineCC: null,
  maxEngineCC: null,
  description: 'Binek araç KDV',
  isActive: true,
  effectiveFrom: new Date('2024-01-01'),
  effectiveTo: null,
  createdBy: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  history: [],
};

const mockHistory = [
  {
    id: 'history-1',
    taxRateId: 'taxrate-1',
    oldValue: 18,
    newValue: 20,
    changedBy: 'user-1',
    reason: 'Yasal güncelleme',
    changedAt: new Date('2024-06-01'),
  },
];

const defaultParams = {
  page: 1,
  limit: 10,
  skip: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
};

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //

describe('TaxRateService', () => {
  let service: TaxRateService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaxRateService();
  });

  // ---------------------------------------------------------------- //
  // getAll
  // ---------------------------------------------------------------- //
  describe('getAll', () => {
    it('should return data and total when called with default params', async () => {
      const mockList = [mockTaxRate];
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue(mockList as any);
      vi.mocked(prisma.taxRate.count).mockResolvedValue(1);

      const result = await service.getAll(defaultParams);

      expect(result.data).toEqual(mockList);
      expect(result.total).toBe(1);
    });

    it('should call findMany with correct skip and take from params', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue([]);
      vi.mocked(prisma.taxRate.count).mockResolvedValue(0);

      await service.getAll({ ...defaultParams, skip: 10, limit: 5 });

      expect(prisma.taxRate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it('should filter by isActive when provided', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue([]);
      vi.mocked(prisma.taxRate.count).mockResolvedValue(0);

      await service.getAll({ ...defaultParams, isActive: true });

      expect(prisma.taxRate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
      );
    });

    it('should build OR search clause when search param is provided', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue([]);
      vi.mocked(prisma.taxRate.count).mockResolvedValue(0);

      await service.getAll({ ...defaultParams, search: 'KDV' });

      expect(prisma.taxRate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
              expect.objectContaining({ code: expect.any(Object) }),
            ]),
          }),
        }),
      );
    });

    it('should not add isActive filter when isActive is undefined', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue([]);
      vi.mocked(prisma.taxRate.count).mockResolvedValue(0);

      await service.getAll({ ...defaultParams });

      const call = vi.mocked(prisma.taxRate.findMany).mock.calls[0][0] as any;
      expect(call.where.isActive).toBeUndefined();
    });

    it('should run findMany and count in parallel', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue([]);
      vi.mocked(prisma.taxRate.count).mockResolvedValue(0);

      await service.getAll(defaultParams);

      expect(prisma.taxRate.findMany).toHaveBeenCalledOnce();
      expect(prisma.taxRate.count).toHaveBeenCalledOnce();
    });

    it('should return empty data array when no records exist', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue([]);
      vi.mocked(prisma.taxRate.count).mockResolvedValue(0);

      const result = await service.getAll(defaultParams);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ---------------------------------------------------------------- //
  // getById
  // ---------------------------------------------------------------- //
  describe('getById', () => {
    it('should return the tax rate when found', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(mockTaxRate as any);

      const result = await service.getById('taxrate-1');

      expect(result).toEqual(mockTaxRate);
    });

    it('should call findUnique with the correct id', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(mockTaxRate as any);

      await service.getById('taxrate-1');

      expect(prisma.taxRate.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'taxrate-1' } }),
      );
    });

    it('should throw NotFoundError when tax rate does not exist', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(null);

      await expect(service.getById('non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError with the correct message', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(null);

      await expect(service.getById('non-existent')).rejects.toThrow('Tax rate not found');
    });
  });

  // ---------------------------------------------------------------- //
  // create
  // ---------------------------------------------------------------- //
  describe('create', () => {
    const createData = {
      code: 'KDV20',
      name: 'KDV %20',
      nameEn: 'VAT 20%',
      rate: 20,
      rateType: 'PERCENTAGE' as const,
      vehicleType: 'PASSENGER' as const,
      isActive: true,
    };

    it('should create and return the new tax rate', async () => {
      vi.mocked(prisma.taxRate.create).mockResolvedValue(mockTaxRate as any);

      const result = await service.create(createData, 'user-1');

      expect(result).toEqual(mockTaxRate);
    });

    it('should call prisma.taxRate.create with createdBy set to userId', async () => {
      vi.mocked(prisma.taxRate.create).mockResolvedValue(mockTaxRate as any);

      await service.create(createData, 'user-42');

      expect(prisma.taxRate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ createdBy: 'user-42' }),
        }),
      );
    });

    it('should default isActive to true when not specified', async () => {
      const dataWithoutActive = { ...createData };
      delete (dataWithoutActive as any).isActive;
      vi.mocked(prisma.taxRate.create).mockResolvedValue(mockTaxRate as any);

      await service.create(dataWithoutActive, 'user-1');

      expect(prisma.taxRate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should call auditService.log with CREATE action after creation', async () => {
      vi.mocked(prisma.taxRate.create).mockResolvedValue(mockTaxRate as any);

      await service.create(createData, 'user-1', '127.0.0.1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entityType: 'TaxRate',
          entityId: mockTaxRate.id,
          performedBy: 'user-1',
          ipAddress: '127.0.0.1',
        }),
      );
    });

    it('should set effectiveFrom to current date when not provided', async () => {
      const dataBefore = Date.now();
      vi.mocked(prisma.taxRate.create).mockResolvedValue(mockTaxRate as any);

      await service.create({ ...createData }, 'user-1');

      const callArg = vi.mocked(prisma.taxRate.create).mock.calls[0][0] as any;
      const effectiveFrom: Date = callArg.data.effectiveFrom;
      expect(effectiveFrom.getTime()).toBeGreaterThanOrEqual(dataBefore);
    });

    it('should set effectiveTo to null when not provided', async () => {
      vi.mocked(prisma.taxRate.create).mockResolvedValue(mockTaxRate as any);

      await service.create({ ...createData }, 'user-1');

      const callArg = vi.mocked(prisma.taxRate.create).mock.calls[0][0] as any;
      expect(callArg.data.effectiveTo).toBeNull();
    });

    it('should parse effectiveFrom string into a Date object', async () => {
      vi.mocked(prisma.taxRate.create).mockResolvedValue(mockTaxRate as any);

      await service.create({ ...createData, effectiveFrom: '2025-01-01' }, 'user-1');

      const callArg = vi.mocked(prisma.taxRate.create).mock.calls[0][0] as any;
      expect(callArg.data.effectiveFrom).toBeInstanceOf(Date);
    });
  });

  // ---------------------------------------------------------------- //
  // update
  // ---------------------------------------------------------------- //
  describe('update', () => {
    it('should throw NotFoundError when tax rate does not exist', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(null);

      await expect(service.update('non-existent', { rate: 25 }, 'user-1')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should return the updated tax rate', async () => {
      const updated = { ...mockTaxRate, rate: 25 };
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(mockTaxRate as any);
      vi.mocked(prisma.taxRateHistory.create).mockResolvedValue({} as any);
      vi.mocked(prisma.taxRate.update).mockResolvedValue(updated as any);

      const result = await service.update('taxrate-1', { rate: 25 }, 'user-1');

      expect(result).toEqual(updated);
    });

    it('should create a TaxRateHistory record when rate changes', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(mockTaxRate as any);
      vi.mocked(prisma.taxRateHistory.create).mockResolvedValue({} as any);
      vi.mocked(prisma.taxRate.update).mockResolvedValue({ ...mockTaxRate, rate: 25 } as any);

      await service.update('taxrate-1', { rate: 25 }, 'user-1', 'Yasal güncelleme');

      expect(prisma.taxRateHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            taxRateId: 'taxrate-1',
            oldValue: mockTaxRate.rate,
            newValue: 25,
            changedBy: 'user-1',
            reason: 'Yasal güncelleme',
          }),
        }),
      );
    });

    it('should not create TaxRateHistory when rate is unchanged', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(mockTaxRate as any);
      vi.mocked(prisma.taxRate.update).mockResolvedValue(mockTaxRate as any);

      await service.update('taxrate-1', { name: 'Yeni İsim' }, 'user-1');

      expect(prisma.taxRateHistory.create).not.toHaveBeenCalled();
    });

    it('should not create TaxRateHistory when same rate value is passed', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(mockTaxRate as any);
      vi.mocked(prisma.taxRate.update).mockResolvedValue(mockTaxRate as any);

      await service.update('taxrate-1', { rate: 20 }, 'user-1');

      expect(prisma.taxRateHistory.create).not.toHaveBeenCalled();
    });

    it('should call auditService.log with UPDATE action', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(mockTaxRate as any);
      vi.mocked(prisma.taxRate.update).mockResolvedValue({ ...mockTaxRate, rate: 25 } as any);
      vi.mocked(prisma.taxRateHistory.create).mockResolvedValue({} as any);

      await service.update('taxrate-1', { rate: 25 }, 'user-1', undefined, '10.0.0.1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entityType: 'TaxRate',
          entityId: 'taxrate-1',
          performedBy: 'user-1',
          ipAddress: '10.0.0.1',
        }),
      );
    });

    it('should store null reason in history when reason is not provided', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(mockTaxRate as any);
      vi.mocked(prisma.taxRateHistory.create).mockResolvedValue({} as any);
      vi.mocked(prisma.taxRate.update).mockResolvedValue({ ...mockTaxRate, rate: 30 } as any);

      await service.update('taxrate-1', { rate: 30 }, 'user-1');

      expect(prisma.taxRateHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reason: null }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------- //
  // delete
  // ---------------------------------------------------------------- //
  describe('delete', () => {
    it('should delete the tax rate when found', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(mockTaxRate as any);
      vi.mocked(prisma.taxRate.delete).mockResolvedValue(mockTaxRate as any);

      await service.delete('taxrate-1', 'user-1');

      expect(prisma.taxRate.delete).toHaveBeenCalledWith({ where: { id: 'taxrate-1' } });
    });

    it('should throw NotFoundError when tax rate does not exist', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(null);

      await expect(service.delete('non-existent', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError with the correct message on delete', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(null);

      await expect(service.delete('non-existent', 'user-1')).rejects.toThrow('Tax rate not found');
    });

    it('should call auditService.log with DELETE action after deletion', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(mockTaxRate as any);
      vi.mocked(prisma.taxRate.delete).mockResolvedValue(mockTaxRate as any);

      await service.delete('taxrate-1', 'user-1', '192.168.1.1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
          entityType: 'TaxRate',
          entityId: 'taxrate-1',
          performedBy: 'user-1',
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('should not call prisma.taxRate.delete when tax rate is not found', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(null);

      await expect(service.delete('non-existent', 'user-1')).rejects.toThrow();
      expect(prisma.taxRate.delete).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------- //
  // getHistory
  // ---------------------------------------------------------------- //
  describe('getHistory', () => {
    it('should return history records for an existing tax rate', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(mockTaxRate as any);
      vi.mocked(prisma.taxRateHistory.findMany).mockResolvedValue(mockHistory as any);

      const result = await service.getHistory('taxrate-1');

      expect(result).toEqual(mockHistory);
    });

    it('should throw NotFoundError when tax rate does not exist', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(null);

      await expect(service.getHistory('non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should query history ordered by changedAt desc', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(mockTaxRate as any);
      vi.mocked(prisma.taxRateHistory.findMany).mockResolvedValue([]);

      await service.getHistory('taxrate-1');

      expect(prisma.taxRateHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { taxRateId: 'taxrate-1' },
          orderBy: { changedAt: 'desc' },
        }),
      );
    });

    it('should return empty array when no history exists', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValue(mockTaxRate as any);
      vi.mocked(prisma.taxRateHistory.findMany).mockResolvedValue([]);

      const result = await service.getHistory('taxrate-1');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------- //
  // getActiveTaxRates
  // ---------------------------------------------------------------- //
  describe('getActiveTaxRates', () => {
    it('should return only active tax rates', async () => {
      const activeRates = [mockTaxRate];
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue(activeRates as any);

      const result = await service.getActiveTaxRates();

      expect(result).toEqual(activeRates);
    });

    it('should query with isActive: true filter', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue([]);

      await service.getActiveTaxRates();

      expect(prisma.taxRate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('should order results by code ascending', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue([]);

      await service.getActiveTaxRates();

      expect(prisma.taxRate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { code: 'asc' } }),
      );
    });

    it('should return empty array when no active rates exist', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue([]);

      const result = await service.getActiveTaxRates();

      expect(result).toEqual([]);
    });
  });
});
