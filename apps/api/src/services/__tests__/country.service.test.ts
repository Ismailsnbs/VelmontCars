import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CountryService } from '../country.service';
import { NotFoundError, BadRequestError } from '../../middleware/error.middleware';

// ------------------------------------------------------------------ //
// Mocks
// ------------------------------------------------------------------ //

vi.mock('../../lib/prisma', () => ({
  default: {
    originCountry: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    vehicle: {
      count: vi.fn(),
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

const mockCountry = {
  id: 'country-1',
  code: 'JP',
  name: 'Japan',
  flag: 'jp.png',
  customsDutyRate: 10,
  isEU: false,
  minShippingCost: 500,
  maxShippingCost: 1500,
  avgShippingDays: 30,
  notes: null,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const defaultParams = {
  page: 1,
  limit: 10,
  skip: 0,
  sortBy: 'name',
  sortOrder: 'asc' as const,
};

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //

describe('CountryService', () => {
  let service: CountryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CountryService();
  });

  // ---------------------------------------------------------------- //
  // getAll
  // ---------------------------------------------------------------- //
  describe('getAll', () => {
    it('should return data and total with default params', async () => {
      vi.mocked(prisma.originCountry.findMany).mockResolvedValue([mockCountry] as any);
      vi.mocked(prisma.originCountry.count).mockResolvedValue(1);

      const result = await service.getAll(defaultParams);

      expect(result.data).toEqual([mockCountry]);
      expect(result.total).toBe(1);
    });

    it('should call findMany with correct skip and take', async () => {
      vi.mocked(prisma.originCountry.findMany).mockResolvedValue([]);
      vi.mocked(prisma.originCountry.count).mockResolvedValue(0);

      await service.getAll({ ...defaultParams, skip: 20, limit: 5 });

      expect(prisma.originCountry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 5 }),
      );
    });

    it('should filter by isActive when provided as true', async () => {
      vi.mocked(prisma.originCountry.findMany).mockResolvedValue([]);
      vi.mocked(prisma.originCountry.count).mockResolvedValue(0);

      await service.getAll({ ...defaultParams, isActive: true });

      expect(prisma.originCountry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
      );
    });

    it('should filter by isActive when provided as false', async () => {
      vi.mocked(prisma.originCountry.findMany).mockResolvedValue([]);
      vi.mocked(prisma.originCountry.count).mockResolvedValue(0);

      await service.getAll({ ...defaultParams, isActive: false });

      expect(prisma.originCountry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: false }) }),
      );
    });

    it('should build OR search clause when search param is provided', async () => {
      vi.mocked(prisma.originCountry.findMany).mockResolvedValue([]);
      vi.mocked(prisma.originCountry.count).mockResolvedValue(0);

      await service.getAll({ ...defaultParams, search: 'Japan' });

      const call = vi.mocked(prisma.originCountry.findMany).mock.calls[0][0] as any;
      expect(call.where.OR).toBeDefined();
      expect(call.where.OR).toHaveLength(2);
    });

    it('should not set OR clause when search is not provided', async () => {
      vi.mocked(prisma.originCountry.findMany).mockResolvedValue([]);
      vi.mocked(prisma.originCountry.count).mockResolvedValue(0);

      await service.getAll(defaultParams);

      const call = vi.mocked(prisma.originCountry.findMany).mock.calls[0][0] as any;
      expect(call.where.OR).toBeUndefined();
    });

    it('should return empty data when no countries exist', async () => {
      vi.mocked(prisma.originCountry.findMany).mockResolvedValue([]);
      vi.mocked(prisma.originCountry.count).mockResolvedValue(0);

      const result = await service.getAll(defaultParams);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ---------------------------------------------------------------- //
  // getById
  // ---------------------------------------------------------------- //
  describe('getById', () => {
    it('should return the country when found', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);

      const result = await service.getById('country-1');

      expect(result).toEqual(mockCountry);
    });

    it('should call findUnique with the correct id', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);

      await service.getById('country-1');

      expect(prisma.originCountry.findUnique).toHaveBeenCalledWith({ where: { id: 'country-1' } });
    });

    it('should throw NotFoundError when country does not exist', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(null);

      await expect(service.getById('non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should include the id in the error message', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(null);

      await expect(service.getById('bad-id')).rejects.toThrow('bad-id');
    });
  });

  // ---------------------------------------------------------------- //
  // create
  // ---------------------------------------------------------------- //
  describe('create', () => {
    const createInput = {
      code: 'JP',
      name: 'Japan',
      customsDutyRate: 10,
      minShippingCost: 500,
      maxShippingCost: 1500,
    };

    it('should create and return the new country', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.originCountry.create).mockResolvedValue(mockCountry as any);

      const result = await service.create(createInput, 'user-1');

      expect(result).toEqual(mockCountry);
    });

    it('should check for existing code before creating', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.originCountry.create).mockResolvedValue(mockCountry as any);

      await service.create(createInput, 'user-1');

      expect(prisma.originCountry.findUnique).toHaveBeenCalledWith({ where: { code: 'JP' } });
    });

    it('should throw BadRequestError when country code already exists', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);

      await expect(service.create(createInput, 'user-1')).rejects.toThrow(BadRequestError);
    });

    it('should include the duplicate code in the BadRequestError message', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);

      await expect(service.create(createInput, 'user-1')).rejects.toThrow('JP');
    });

    it('should not call prisma.create when duplicate code exists', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);

      await expect(service.create(createInput, 'user-1')).rejects.toThrow();
      expect(prisma.originCountry.create).not.toHaveBeenCalled();
    });

    it('should default isEU to false when not provided', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.originCountry.create).mockResolvedValue(mockCountry as any);

      await service.create(createInput, 'user-1');

      expect(prisma.originCountry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isEU: false }),
        }),
      );
    });

    it('should always set isActive to true on creation', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.originCountry.create).mockResolvedValue(mockCountry as any);

      await service.create(createInput, 'user-1');

      expect(prisma.originCountry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should call auditService.log with CREATE action', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.originCountry.create).mockResolvedValue(mockCountry as any);

      await service.create(createInput, 'user-1', '10.0.0.1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entityType: 'OriginCountry',
          entityId: mockCountry.id,
          performedBy: 'user-1',
          ipAddress: '10.0.0.1',
        }),
      );
    });
  });

  // ---------------------------------------------------------------- //
  // update
  // ---------------------------------------------------------------- //
  describe('update', () => {
    it('should return the updated country', async () => {
      const updated = { ...mockCountry, name: 'Japan Updated' };
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);
      vi.mocked(prisma.originCountry.update).mockResolvedValue(updated as any);

      const result = await service.update('country-1', { name: 'Japan Updated' }, 'user-1');

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundError when country does not exist', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(null);

      await expect(service.update('bad-id', { name: 'X' }, 'user-1')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should check code uniqueness when code is being updated to a new value', async () => {
      vi.mocked(prisma.originCountry.findUnique)
        .mockResolvedValueOnce(mockCountry as any)  // existing
        .mockResolvedValueOnce(null);               // code uniqueness check
      vi.mocked(prisma.originCountry.update).mockResolvedValue({ ...mockCountry, code: 'DE' } as any);

      await service.update('country-1', { code: 'DE' }, 'user-1');

      expect(prisma.originCountry.findUnique).toHaveBeenCalledWith({ where: { code: 'DE' } });
    });

    it('should throw BadRequestError when updating to a code that already exists', async () => {
      const anotherCountry = { ...mockCountry, id: 'country-2', code: 'DE' };
      vi.mocked(prisma.originCountry.findUnique)
        .mockResolvedValueOnce(mockCountry as any)      // existing
        .mockResolvedValueOnce(anotherCountry as any);  // code uniqueness check

      await expect(service.update('country-1', { code: 'DE' }, 'user-1')).rejects.toThrow(
        BadRequestError,
      );
    });

    it('should not check code uniqueness when code is unchanged', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);
      vi.mocked(prisma.originCountry.update).mockResolvedValue(mockCountry as any);

      await service.update('country-1', { name: 'New Name' }, 'user-1');

      // Only one findUnique call (existing check), no code uniqueness check
      expect(prisma.originCountry.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should call auditService.log with UPDATE action', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);
      vi.mocked(prisma.originCountry.update).mockResolvedValue(mockCountry as any);

      await service.update('country-1', { name: 'Updated' }, 'user-1', '10.0.0.1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entityType: 'OriginCountry',
          entityId: 'country-1',
          performedBy: 'user-1',
          ipAddress: '10.0.0.1',
        }),
      );
    });
  });

  // ---------------------------------------------------------------- //
  // delete
  // ---------------------------------------------------------------- //
  describe('delete', () => {
    it('should delete the country and return the id', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);
      vi.mocked(prisma.originCountry.delete).mockResolvedValue(mockCountry as any);

      const result = await service.delete('country-1', 'user-1');

      expect(result).toEqual({ id: 'country-1' });
    });

    it('should throw NotFoundError when country does not exist', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(null);

      await expect(service.delete('bad-id', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when vehicles reference this country', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(3);

      await expect(service.delete('country-1', 'user-1')).rejects.toThrow(BadRequestError);
    });

    it('should include vehicle count in the error message', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(5);

      await expect(service.delete('country-1', 'user-1')).rejects.toThrow('5');
    });

    it('should not call prisma.delete when vehicles exist', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(2);

      await expect(service.delete('country-1', 'user-1')).rejects.toThrow();
      expect(prisma.originCountry.delete).not.toHaveBeenCalled();
    });

    it('should call auditService.log with DELETE action after successful deletion', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);
      vi.mocked(prisma.originCountry.delete).mockResolvedValue(mockCountry as any);

      await service.delete('country-1', 'user-1', '10.0.0.1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
          entityType: 'OriginCountry',
          entityId: 'country-1',
          performedBy: 'user-1',
          ipAddress: '10.0.0.1',
        }),
      );
    });

    it('should check vehicle count with the correct countryId', async () => {
      vi.mocked(prisma.originCountry.findUnique).mockResolvedValue(mockCountry as any);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);
      vi.mocked(prisma.originCountry.delete).mockResolvedValue(mockCountry as any);

      await service.delete('country-1', 'user-1');

      expect(prisma.vehicle.count).toHaveBeenCalledWith({
        where: { originCountryId: 'country-1' },
      });
    });
  });

  // ---------------------------------------------------------------- //
  // getActiveCountries
  // ---------------------------------------------------------------- //
  describe('getActiveCountries', () => {
    it('should return only active countries', async () => {
      vi.mocked(prisma.originCountry.findMany).mockResolvedValue([mockCountry] as any);

      const result = await service.getActiveCountries();

      expect(result).toEqual([mockCountry]);
    });

    it('should query with isActive: true', async () => {
      vi.mocked(prisma.originCountry.findMany).mockResolvedValue([]);

      await service.getActiveCountries();

      expect(prisma.originCountry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('should order results by name ascending', async () => {
      vi.mocked(prisma.originCountry.findMany).mockResolvedValue([]);

      await service.getActiveCountries();

      expect(prisma.originCountry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } }),
      );
    });

    it('should return empty array when no active countries exist', async () => {
      vi.mocked(prisma.originCountry.findMany).mockResolvedValue([]);

      const result = await service.getActiveCountries();

      expect(result).toEqual([]);
    });
  });
});
