import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { VehicleService } from '../vehicle.service';
import { NotFoundError, BadRequestError } from '../../middleware/error.middleware';

// ------------------------------------------------------------------ //
// Prisma mock
// ------------------------------------------------------------------ //

vi.mock('../../lib/prisma', () => ({
  default: {
    vehicle: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
    vehicleDocument: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    vehicleExpense: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      aggregate: vi.fn(),
    },
    vehicleImage: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    originCountry: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((fn) => (typeof fn === 'function' ? fn(prisma) : Promise.all(fn))),
  },
}));

import prisma from '../../lib/prisma';

// ------------------------------------------------------------------ //
// Fixtures
// ------------------------------------------------------------------ //

const GALLERY_ID = 'gallery-aaa-111';
const OTHER_GALLERY_ID = 'gallery-bbb-222';
const VEHICLE_ID = 'vehicle-ccc-333';
const COUNTRY_ID = 'country-ddd-444';

const mockOriginCountry = {
  id: COUNTRY_ID,
  code: 'JP',
  name: 'Japan',
  flag: '🇯🇵',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockVehicle = {
  id: VEHICLE_ID,
  brand: 'Toyota',
  model: 'Corolla',
  year: 2022,
  vin: 'JT2BF22K1W0123456',
  color: 'White',
  mileage: 0,
  fuelType: 'PETROL',
  transmission: 'AUTOMATIC',
  engineCC: 1600,
  bodyType: 'Sedan',
  originCountryId: COUNTRY_ID,
  fobPrice: new Prisma.Decimal(6000),
  fobCurrency: 'USD',
  shippingCost: new Prisma.Decimal(600),
  insuranceCost: new Prisma.Decimal(100),
  cifValue: new Prisma.Decimal(6700),
  customsDuty: null,
  kdv: null,
  fif: null,
  generalFif: null,
  gkk: null,
  wharfFee: null,
  bandrol: null,
  otherFees: null,
  totalImportCost: null,
  additionalExpenses: new Prisma.Decimal(0),
  totalCost: null,
  salePrice: null,
  profit: null,
  profitMargin: null,
  status: 'TRANSIT' as const,
  estimatedArrival: null,
  arrivalDate: null,
  soldDate: null,
  description: null,
  galleryId: GALLERY_ID,
  taxSnapshotId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const defaultListParams = {
  galleryId: GALLERY_ID,
  page: 1,
  limit: 20,
  skip: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
};

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //

describe('VehicleService', () => {
  let service: VehicleService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new VehicleService();
  });

  // ---------------------------------------------------------------- //
  // getAll
  // ---------------------------------------------------------------- //
  describe('getAll', () => {
    it('should return data and total with default params and always scope to galleryId', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([mockVehicle] as any);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(1);

      const result = await service.getAll(defaultListParams);

      expect(result.data).toEqual([mockVehicle]);
      expect(result.total).toBe(1);
      expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ galleryId: GALLERY_ID }),
        })
      );
      expect(prisma.vehicle.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ galleryId: GALLERY_ID }),
        })
      );
    });

    it('should apply status filter when status param is provided', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);

      await service.getAll({ ...defaultListParams, status: 'IN_STOCK' });

      const call = vi.mocked(prisma.vehicle.findMany).mock.calls[0][0] as any;
      expect(call.where.status).toBe('IN_STOCK');
    });

    it('should apply brand filter with case-insensitive contains when brand param is provided', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);

      await service.getAll({ ...defaultListParams, brand: 'toyota' });

      const call = vi.mocked(prisma.vehicle.findMany).mock.calls[0][0] as any;
      expect(call.where.brand).toEqual({ contains: 'toyota', mode: 'insensitive' });
    });

    it('should build OR search clause across brand, model and vin when search param is provided', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);

      await service.getAll({ ...defaultListParams, search: 'corolla' });

      const call = vi.mocked(prisma.vehicle.findMany).mock.calls[0][0] as any;
      expect(call.where.OR).toHaveLength(3);
      expect(call.where.OR[0]).toEqual({ brand: { contains: 'corolla', mode: 'insensitive' } });
      expect(call.where.OR[1]).toEqual({ model: { contains: 'corolla', mode: 'insensitive' } });
      expect(call.where.OR[2]).toEqual({ vin: { contains: 'corolla', mode: 'insensitive' } });
    });

    it('should apply yearFrom filter as gte when only yearFrom is provided', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);

      await service.getAll({ ...defaultListParams, yearFrom: 2020 });

      const call = vi.mocked(prisma.vehicle.findMany).mock.calls[0][0] as any;
      expect(call.where.year).toEqual({ gte: 2020 });
    });

    it('should apply yearTo filter as lte when only yearTo is provided', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);

      await service.getAll({ ...defaultListParams, yearTo: 2023 });

      const call = vi.mocked(prisma.vehicle.findMany).mock.calls[0][0] as any;
      expect(call.where.year).toEqual({ lte: 2023 });
    });

    it('should apply both yearFrom and yearTo as a range', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);

      await service.getAll({ ...defaultListParams, yearFrom: 2018, yearTo: 2023 });

      const call = vi.mocked(prisma.vehicle.findMany).mock.calls[0][0] as any;
      expect(call.where.year).toEqual({ gte: 2018, lte: 2023 });
    });

    it('should apply fobPriceMin as Decimal gte', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);

      await service.getAll({ ...defaultListParams, fobPriceMin: 5000 });

      const call = vi.mocked(prisma.vehicle.findMany).mock.calls[0][0] as any;
      expect(call.where.fobPrice.gte).toEqual(new Prisma.Decimal(5000));
    });

    it('should apply fobPriceMax as Decimal lte', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);

      await service.getAll({ ...defaultListParams, fobPriceMax: 15000 });

      const call = vi.mocked(prisma.vehicle.findMany).mock.calls[0][0] as any;
      expect(call.where.fobPrice.lte).toEqual(new Prisma.Decimal(15000));
    });

    it('should apply engineCCMin and engineCCMax as integer range', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);

      await service.getAll({ ...defaultListParams, engineCCMin: 1000, engineCCMax: 2000 });

      const call = vi.mocked(prisma.vehicle.findMany).mock.calls[0][0] as any;
      expect(call.where.engineCC).toEqual({ gte: 1000, lte: 2000 });
    });

    it('should include images (main only), originCountry and _count in results', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);

      await service.getAll(defaultListParams);

      const call = vi.mocked(prisma.vehicle.findMany).mock.calls[0][0] as any;
      expect(call.include.images).toBeDefined();
      expect(call.include.images.where).toEqual({ isMain: true });
      expect(call.include.originCountry).toBeDefined();
      expect(call.include._count).toBeDefined();
    });

    it('should pass skip and limit (take) to findMany', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);

      await service.getAll({ ...defaultListParams, skip: 40, limit: 20 });

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 })
      );
    });

    it('should return empty data and zero total when no vehicles exist', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);

      const result = await service.getAll(defaultListParams);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should not add status filter when status param is undefined', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.count).mockResolvedValue(0);

      await service.getAll(defaultListParams);

      const call = vi.mocked(prisma.vehicle.findMany).mock.calls[0][0] as any;
      expect(call.where.status).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------- //
  // getById
  // ---------------------------------------------------------------- //
  describe('getById', () => {
    it('should return the vehicle when found and galleryId matches', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);

      const result = await service.getById(VEHICLE_ID, GALLERY_ID);

      expect(result).toEqual(mockVehicle);
      expect(prisma.vehicle.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VEHICLE_ID, galleryId: GALLERY_ID },
        })
      );
    });

    it('should throw NotFoundError when vehicle does not exist', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getById('non-existent', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when vehicle belongs to a different gallery (tenant isolation)', async () => {
      // Prisma returns null because galleryId doesn't match — simulates tenant isolation
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getById(VEHICLE_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
      expect(prisma.vehicle.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VEHICLE_ID, galleryId: OTHER_GALLERY_ID },
        })
      );
    });

    it('should include vehicle id in the NotFoundError message', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getById('bad-vehicle-id', GALLERY_ID)).rejects.toThrow('bad-vehicle-id');
    });

    it('should include images, documents, expenses, calculations and sale in result', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);

      await service.getById(VEHICLE_ID, GALLERY_ID);

      const call = vi.mocked(prisma.vehicle.findFirst).mock.calls[0][0] as any;
      expect(call.include.images).toBeDefined();
      expect(call.include.documents).toBeDefined();
      expect(call.include.expenses).toBeDefined();
      expect(call.include.calculations).toBeDefined();
      expect(call.include.sale).toBeDefined();
    });

    it('should include originCountry and taxSnapshot in result', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);

      await service.getById(VEHICLE_ID, GALLERY_ID);

      const call = vi.mocked(prisma.vehicle.findFirst).mock.calls[0][0] as any;
      expect(call.include.originCountry).toBe(true);
      expect(call.include.taxSnapshot).toBe(true);
    });
  });

  // ---------------------------------------------------------------- //
  // create
  // ---------------------------------------------------------------- //
  describe('create', () => {
    const createInput = {
      brand: 'Toyota',
      model: 'Corolla',
      year: 2022,
      engineCC: 1600,
      originCountryId: COUNTRY_ID,
      fobPrice: 6000,
      fobCurrency: 'USD',
      status: 'TRANSIT' as const,
    };

    it('should create and return the vehicle with galleryId attached', async () => {
      vi.mocked(prisma.originCountry.findFirst).mockResolvedValue(mockOriginCountry as any);
      vi.mocked(prisma.vehicle.create).mockResolvedValue(mockVehicle as any);

      const result = await service.create(createInput, GALLERY_ID);

      expect(result).toEqual(mockVehicle);
      expect(prisma.vehicle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ galleryId: GALLERY_ID }),
        })
      );
    });

    it('should default status to TRANSIT when status is not provided', async () => {
      vi.mocked(prisma.originCountry.findFirst).mockResolvedValue(mockOriginCountry as any);
      vi.mocked(prisma.vehicle.create).mockResolvedValue(mockVehicle as any);

      await service.create(createInput, GALLERY_ID);

      expect(prisma.vehicle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'TRANSIT' }),
        })
      );
    });

    it('should use provided status when explicitly set', async () => {
      vi.mocked(prisma.originCountry.findFirst).mockResolvedValue(mockOriginCountry as any);
      vi.mocked(prisma.vehicle.create).mockResolvedValue({ ...mockVehicle, status: 'IN_STOCK' } as any);

      await service.create({ ...createInput, status: 'IN_STOCK' }, GALLERY_ID);

      expect(prisma.vehicle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'IN_STOCK' }),
        })
      );
    });

    it('should throw BadRequestError when originCountry is not found or inactive', async () => {
      vi.mocked(prisma.originCountry.findFirst).mockResolvedValue(null);

      await expect(service.create(createInput, GALLERY_ID)).rejects.toThrow(BadRequestError);
      expect(prisma.vehicle.create).not.toHaveBeenCalled();
    });

    it('should validate originCountryId exists before creating the vehicle', async () => {
      vi.mocked(prisma.originCountry.findFirst).mockResolvedValue(null);

      await expect(service.create(createInput, GALLERY_ID)).rejects.toThrow(
        `Origin country with ID ${COUNTRY_ID} not found or inactive`
      );
    });

    it('should set additionalExpenses to 0 when not provided', async () => {
      vi.mocked(prisma.originCountry.findFirst).mockResolvedValue(mockOriginCountry as any);
      vi.mocked(prisma.vehicle.create).mockResolvedValue(mockVehicle as any);

      await service.create(createInput, GALLERY_ID);

      const call = vi.mocked(prisma.vehicle.create).mock.calls[0][0] as any;
      expect(call.data.additionalExpenses).toEqual(new Prisma.Decimal(0));
    });

    it('should convert fobPrice to Prisma.Decimal', async () => {
      vi.mocked(prisma.originCountry.findFirst).mockResolvedValue(mockOriginCountry as any);
      vi.mocked(prisma.vehicle.create).mockResolvedValue(mockVehicle as any);

      await service.create(createInput, GALLERY_ID);

      const call = vi.mocked(prisma.vehicle.create).mock.calls[0][0] as any;
      expect(call.data.fobPrice).toEqual(new Prisma.Decimal(6000));
    });

    it('should include originCountry and images in create result', async () => {
      vi.mocked(prisma.originCountry.findFirst).mockResolvedValue(mockOriginCountry as any);
      vi.mocked(prisma.vehicle.create).mockResolvedValue(mockVehicle as any);

      await service.create(createInput, GALLERY_ID);

      const call = vi.mocked(prisma.vehicle.create).mock.calls[0][0] as any;
      expect(call.include.originCountry).toBeDefined();
      expect(call.include.images).toBe(true);
    });

    it('should query originCountry with isActive: true', async () => {
      vi.mocked(prisma.originCountry.findFirst).mockResolvedValue(null);

      await expect(service.create(createInput, GALLERY_ID)).rejects.toThrow(BadRequestError);
      expect(prisma.originCountry.findFirst).toHaveBeenCalledWith({
        where: { id: COUNTRY_ID, isActive: true },
      });
    });
  });

  // ---------------------------------------------------------------- //
  // update
  // ---------------------------------------------------------------- //
  describe('update', () => {
    const updateInput = { brand: 'Honda', model: 'Civic' };

    it('should update and return the vehicle when owned by the gallery', async () => {
      const updated = { ...mockVehicle, brand: 'Honda', model: 'Civic' };
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(updated as any);

      const result = await service.update(VEHICLE_ID, updateInput, GALLERY_ID);

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundError when vehicle does not belong to gallery (tenant isolation)', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.update(VEHICLE_ID, updateInput, OTHER_GALLERY_ID)).rejects.toThrow(
        NotFoundError
      );
      expect(prisma.vehicle.update).not.toHaveBeenCalled();
    });

    it('should verify ownership by querying with both id and galleryId', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.update(VEHICLE_ID, updateInput, GALLERY_ID);

      expect(prisma.vehicle.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VEHICLE_ID, galleryId: GALLERY_ID },
        })
      );
    });

    it('should validate new originCountryId when it changes', async () => {
      const newCountryId = 'country-new-555';
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.originCountry.findFirst).mockResolvedValue(null);

      await expect(
        service.update(VEHICLE_ID, { originCountryId: newCountryId }, GALLERY_ID)
      ).rejects.toThrow(BadRequestError);
    });

    it('should skip originCountry validation when originCountryId is unchanged', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      // Same ID as existing — should not call findFirst for country
      await service.update(VEHICLE_ID, { originCountryId: COUNTRY_ID }, GALLERY_ID);

      expect(prisma.originCountry.findFirst).not.toHaveBeenCalled();
    });

    it('should convert numeric fields to Prisma.Decimal in update data', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.update(VEHICLE_ID, { fobPrice: 7000, shippingCost: 700 }, GALLERY_ID);

      const call = vi.mocked(prisma.vehicle.update).mock.calls[0][0] as any;
      expect(call.data.fobPrice).toEqual(new Prisma.Decimal(7000));
      expect(call.data.shippingCost).toEqual(new Prisma.Decimal(700));
    });

    it('should only include fields that are explicitly provided in update data', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle as any);

      await service.update(VEHICLE_ID, { brand: 'Nissan' }, GALLERY_ID);

      const call = vi.mocked(prisma.vehicle.update).mock.calls[0][0] as any;
      expect(call.data.brand).toBe('Nissan');
      expect(call.data.model).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------- //
  // delete
  // ---------------------------------------------------------------- //
  describe('delete', () => {
    it('should delete the vehicle and return its id when no associated sale', async () => {
      const vehicleWithNoSale = { ...mockVehicle, sale: null };
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(vehicleWithNoSale as any);
      vi.mocked(prisma.vehicle.delete).mockResolvedValue(vehicleWithNoSale as any);

      const result = await service.delete(VEHICLE_ID, GALLERY_ID);

      expect(result).toEqual({ id: VEHICLE_ID });
      expect(prisma.vehicle.delete).toHaveBeenCalledWith({ where: { id: VEHICLE_ID, galleryId: GALLERY_ID } });
    });

    it('should throw BadRequestError when vehicle has an associated sale record', async () => {
      const vehicleWithSale = { ...mockVehicle, sale: { id: 'sale-111' } };
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(vehicleWithSale as any);

      await expect(service.delete(VEHICLE_ID, GALLERY_ID)).rejects.toThrow(BadRequestError);
      expect(prisma.vehicle.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when vehicle does not belong to gallery (tenant isolation)', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.delete(VEHICLE_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should verify ownership with both id and galleryId before deleting', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.delete(VEHICLE_ID, GALLERY_ID)).rejects.toThrow(NotFoundError);
      expect(prisma.vehicle.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VEHICLE_ID, galleryId: GALLERY_ID },
        })
      );
    });

    it('should include sale relation in the ownership check', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.delete(VEHICLE_ID, GALLERY_ID)).rejects.toThrow();
      const call = vi.mocked(prisma.vehicle.findFirst).mock.calls[0][0] as any;
      expect(call.include.sale).toBeDefined();
    });
  });

  // ---------------------------------------------------------------- //
  // updateStatus
  // ---------------------------------------------------------------- //
  describe('updateStatus', () => {
    const statusUpdateResult = {
      id: VEHICLE_ID,
      status: 'IN_STOCK' as const,
      arrivalDate: new Date(),
      soldDate: null,
      updatedAt: new Date(),
    };

    it('should transition status to IN_STOCK and auto-set arrivalDate', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(statusUpdateResult as any);

      const result = await service.updateStatus(
        VEHICLE_ID,
        { status: 'IN_STOCK' },
        GALLERY_ID
      );

      expect(result.status).toBe('IN_STOCK');
      expect(prisma.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'IN_STOCK',
            arrivalDate: expect.any(Date),
          }),
        })
      );
    });

    it('should transition status to SOLD and auto-set soldDate', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue({
        ...statusUpdateResult,
        status: 'SOLD',
        soldDate: new Date(),
      } as any);

      await service.updateStatus(VEHICLE_ID, { status: 'SOLD' }, GALLERY_ID);

      const call = vi.mocked(prisma.vehicle.update).mock.calls[0][0] as any;
      expect(call.data.status).toBe('SOLD');
      expect(call.data.soldDate).toBeInstanceOf(Date);
    });

    it('should use provided arrivalDate when explicitly given', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(statusUpdateResult as any);

      const specificDate = '2024-06-15T00:00:00.000Z';
      await service.updateStatus(
        VEHICLE_ID,
        { status: 'IN_STOCK', arrivalDate: specificDate },
        GALLERY_ID
      );

      const call = vi.mocked(prisma.vehicle.update).mock.calls[0][0] as any;
      expect(call.data.arrivalDate).toEqual(new Date(specificDate));
    });

    it('should throw NotFoundError when vehicle belongs to a different gallery (tenant isolation)', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(
        service.updateStatus(VEHICLE_ID, { status: 'IN_STOCK' }, OTHER_GALLERY_ID)
      ).rejects.toThrow(NotFoundError);
    });

    it('should only select minimal fields in the update result', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(statusUpdateResult as any);

      await service.updateStatus(VEHICLE_ID, { status: 'RESERVED' }, GALLERY_ID);

      const call = vi.mocked(prisma.vehicle.update).mock.calls[0][0] as any;
      expect(call.select).toBeDefined();
      expect(call.select.id).toBe(true);
      expect(call.select.status).toBe(true);
    });
  });

  // ---------------------------------------------------------------- //
  // moveToStock
  // ---------------------------------------------------------------- //
  describe('moveToStock', () => {
    const stockResult = {
      id: VEHICLE_ID,
      status: 'IN_STOCK' as const,
      arrivalDate: new Date(),
      updatedAt: new Date(),
    };

    it('should transition vehicle from TRANSIT to IN_STOCK', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any); // status: TRANSIT
      vi.mocked(prisma.vehicle.update).mockResolvedValue(stockResult as any);

      const result = await service.moveToStock(VEHICLE_ID, GALLERY_ID);

      expect(result.status).toBe('IN_STOCK');
      expect(prisma.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'IN_STOCK', arrivalDate: expect.any(Date) }),
        })
      );
    });

    it('should throw BadRequestError when vehicle status is not TRANSIT', async () => {
      const inStockVehicle = { ...mockVehicle, status: 'IN_STOCK' };
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(inStockVehicle as any);

      await expect(service.moveToStock(VEHICLE_ID, GALLERY_ID)).rejects.toThrow(BadRequestError);
      expect(prisma.vehicle.update).not.toHaveBeenCalled();
    });

    it('should include current status in the BadRequestError message', async () => {
      const soldVehicle = { ...mockVehicle, status: 'SOLD' };
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(soldVehicle as any);

      await expect(service.moveToStock(VEHICLE_ID, GALLERY_ID)).rejects.toThrow('SOLD');
    });

    it('should throw NotFoundError when vehicle belongs to a different gallery (tenant isolation)', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.moveToStock(VEHICLE_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should use provided arrivalDate when given', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(stockResult as any);

      const specificDate = '2024-08-01T00:00:00.000Z';
      await service.moveToStock(VEHICLE_ID, GALLERY_ID, specificDate);

      const call = vi.mocked(prisma.vehicle.update).mock.calls[0][0] as any;
      expect(call.data.arrivalDate).toEqual(new Date(specificDate));
    });

    it('should auto-generate arrivalDate (today) when no date is provided', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicle.update).mockResolvedValue(stockResult as any);

      const before = new Date();
      await service.moveToStock(VEHICLE_ID, GALLERY_ID);
      const after = new Date();

      const call = vi.mocked(prisma.vehicle.update).mock.calls[0][0] as any;
      const arrivedAt: Date = call.data.arrivalDate;
      expect(arrivedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(arrivedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // ---------------------------------------------------------------- //
  // getStats
  // ---------------------------------------------------------------- //
  describe('getStats', () => {
    const mockGroupBy = [
      { status: 'TRANSIT', _count: { _all: 5 } },
      { status: 'IN_STOCK', _count: { _all: 10 } },
      { status: 'RESERVED', _count: { _all: 2 } },
      { status: 'SOLD', _count: { _all: 15 } },
    ];

    const mockAggregate = {
      _sum: { totalCost: new Prisma.Decimal(500000) },
      _count: { _all: 17 },
    };

    it('should return counts by status for the given gallery', async () => {
      vi.mocked(prisma.vehicle.groupBy).mockResolvedValue(mockGroupBy as any);
      vi.mocked(prisma.vehicle.aggregate).mockResolvedValue(mockAggregate as any);

      const result = await service.getStats(GALLERY_ID);

      expect(result.transit).toBe(5);
      expect(result.inStock).toBe(10);
      expect(result.reserved).toBe(2);
      expect(result.sold).toBe(15);
    });

    it('should return total as sum of all status counts', async () => {
      vi.mocked(prisma.vehicle.groupBy).mockResolvedValue(mockGroupBy as any);
      vi.mocked(prisma.vehicle.aggregate).mockResolvedValue(mockAggregate as any);

      const result = await service.getStats(GALLERY_ID);

      expect(result.total).toBe(32); // 5+10+2+15
    });

    it('should scope groupBy query to the given galleryId', async () => {
      vi.mocked(prisma.vehicle.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.aggregate).mockResolvedValue({ _sum: { totalCost: null }, _count: { _all: 0 } } as any);

      await service.getStats(GALLERY_ID);

      expect(prisma.vehicle.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { galleryId: GALLERY_ID },
        })
      );
    });

    it('should scope aggregate query to the given galleryId', async () => {
      vi.mocked(prisma.vehicle.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.aggregate).mockResolvedValue({ _sum: { totalCost: null }, _count: { _all: 0 } } as any);

      await service.getStats(GALLERY_ID);

      expect(prisma.vehicle.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ galleryId: GALLERY_ID }),
        })
      );
    });

    it('should return zero for status counts that have no matching vehicles', async () => {
      // Only TRANSIT returned — others should default to 0
      vi.mocked(prisma.vehicle.groupBy).mockResolvedValue([
        { status: 'TRANSIT', _count: { _all: 3 } },
      ] as any);
      vi.mocked(prisma.vehicle.aggregate).mockResolvedValue({ _sum: { totalCost: null }, _count: { _all: 0 } } as any);

      const result = await service.getStats(GALLERY_ID);

      expect(result.inStock).toBe(0);
      expect(result.reserved).toBe(0);
      expect(result.sold).toBe(0);
      expect(result.transit).toBe(3);
    });

    it('should return activeInventoryValue from the aggregate sum', async () => {
      vi.mocked(prisma.vehicle.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.aggregate).mockResolvedValue(mockAggregate as any);

      const result = await service.getStats(GALLERY_ID);

      expect(result.activeInventoryValue).toEqual(new Prisma.Decimal(500000));
    });

    it('should return activeInventoryCount from the aggregate count', async () => {
      vi.mocked(prisma.vehicle.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.aggregate).mockResolvedValue(mockAggregate as any);

      const result = await service.getStats(GALLERY_ID);

      expect(result.activeInventoryCount).toBe(17);
    });

    it('should return total zero when gallery has no vehicles at all', async () => {
      vi.mocked(prisma.vehicle.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.vehicle.aggregate).mockResolvedValue({ _sum: { totalCost: null }, _count: { _all: 0 } } as any);

      const result = await service.getStats(GALLERY_ID);

      expect(result.total).toBe(0);
      expect(result.transit).toBe(0);
      expect(result.inStock).toBe(0);
    });
  });
});
