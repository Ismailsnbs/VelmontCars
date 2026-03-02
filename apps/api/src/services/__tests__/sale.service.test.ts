import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { SaleService } from '../sale.service';
import { NotFoundError, BadRequestError } from '../../middleware/error.middleware';

// ------------------------------------------------------------------ //
// Prisma mock
// ------------------------------------------------------------------ //

// Transaction proxy — captures inner tx calls
const txMock = {
  sale: {
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
  },
  vehicle: {
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  customer: {
    findFirst: vi.fn(),
  },
};

vi.mock('../../lib/prisma', () => ({
  default: {
    vehicle: {
      findFirst: vi.fn(),
    },
    sale: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      aggregate: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn(txMock)),
  },
}));

// Audit service mock — we verify it is called without real DB writes
vi.mock('../audit.service', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

// Socket mock
vi.mock('../../socket', () => ({
  emitToGallery: vi.fn(),
}));

import prisma from '../../lib/prisma';
import { auditService } from '../audit.service';
import { emitToGallery } from '../../socket';

// ------------------------------------------------------------------ //
// Fixtures
// ------------------------------------------------------------------ //

const GALLERY_ID = 'gallery-aaa-111';
const OTHER_GALLERY_ID = 'gallery-bbb-222';
const VEHICLE_ID = 'vehicle-ccc-333';
const CUSTOMER_ID = 'customer-ddd-444';
const SALE_ID = 'sale-eee-555';
const USER_ID = 'user-fff-666';

const mockVehicle = {
  id: VEHICLE_ID,
  brand: 'Toyota',
  model: 'Corolla',
  year: 2022,
  color: 'White',
  vin: 'JT2BF22K1W0123456',
  status: 'IN_STOCK',
  galleryId: GALLERY_ID,
  fobPrice: new Prisma.Decimal(10000),
  additionalExpenses: new Prisma.Decimal(500),
  totalCost: new Prisma.Decimal(12000),
  salePrice: null,
  profit: null,
  profitMargin: null,
  calculations: [],
};

const mockCustomer = {
  id: CUSTOMER_ID,
  name: 'Ahmet Yilmaz',
  phone: '+90555000000',
  email: 'ahmet@example.com',
  galleryId: GALLERY_ID,
};

const mockSale = {
  id: SALE_ID,
  vehicleId: VEHICLE_ID,
  customerId: CUSTOMER_ID,
  galleryId: GALLERY_ID,
  salePrice: new Prisma.Decimal(15000),
  totalCost: new Prisma.Decimal(12000),
  profit: new Prisma.Decimal(3000),
  profitMargin: new Prisma.Decimal(20),
  saleDate: new Date('2024-06-01'),
  paymentType: 'CASH',
  notes: null,
  createdBy: USER_ID,
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date('2024-06-01'),
  vehicle: {
    id: VEHICLE_ID,
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    vin: 'JT2BF22K1W0123456',
    color: 'White',
  },
  customer: {
    id: CUSTOMER_ID,
    name: 'Ahmet Yilmaz',
    phone: '+90555000000',
    email: 'ahmet@example.com',
  },
};

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //

describe('SaleService', () => {
  let service: SaleService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SaleService();
    vi.mocked(prisma.$transaction).mockImplementation((fn: any) => fn(txMock));
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
    };

    it('should return paginated sales and total count for the gallery', async () => {
      vi.mocked(prisma.sale.findMany).mockResolvedValue([mockSale] as any);
      vi.mocked(prisma.sale.count).mockResolvedValue(1);

      const result = await service.getAll(baseParams);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should scope the query to galleryId for tenant isolation', async () => {
      vi.mocked(prisma.sale.findMany).mockResolvedValue([]);
      vi.mocked(prisma.sale.count).mockResolvedValue(0);

      await service.getAll(baseParams);

      expect(prisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ galleryId: GALLERY_ID }),
        }),
      );
    });

    it('should apply startDate filter when provided', async () => {
      vi.mocked(prisma.sale.findMany).mockResolvedValue([]);
      vi.mocked(prisma.sale.count).mockResolvedValue(0);

      await service.getAll({ ...baseParams, startDate: '2024-01-01T00:00:00.000Z' });

      const call = vi.mocked(prisma.sale.findMany).mock.calls[0][0] as any;
      expect(call.where.saleDate?.gte).toBeInstanceOf(Date);
    });

    it('should apply endDate filter when provided', async () => {
      vi.mocked(prisma.sale.findMany).mockResolvedValue([]);
      vi.mocked(prisma.sale.count).mockResolvedValue(0);

      await service.getAll({ ...baseParams, endDate: '2024-12-31T23:59:59.999Z' });

      const call = vi.mocked(prisma.sale.findMany).mock.calls[0][0] as any;
      expect(call.where.saleDate?.lte).toBeInstanceOf(Date);
    });

    it('should not set saleDate filter when neither startDate nor endDate is given', async () => {
      vi.mocked(prisma.sale.findMany).mockResolvedValue([]);
      vi.mocked(prisma.sale.count).mockResolvedValue(0);

      await service.getAll(baseParams);

      const call = vi.mocked(prisma.sale.findMany).mock.calls[0][0] as any;
      expect(call.where.saleDate).toBeUndefined();
    });

    it('should apply skip and take for pagination', async () => {
      vi.mocked(prisma.sale.findMany).mockResolvedValue([]);
      vi.mocked(prisma.sale.count).mockResolvedValue(0);

      await service.getAll({ ...baseParams, skip: 20, limit: 10 });

      expect(prisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  // ---------------------------------------------------------------- //
  // getById
  // ---------------------------------------------------------------- //
  describe('getById', () => {
    it('should return the sale when it belongs to the gallery', async () => {
      vi.mocked(prisma.sale.findFirst).mockResolvedValue(mockSale as any);

      const result = await service.getById(SALE_ID, GALLERY_ID);

      expect(result.id).toBe(SALE_ID);
    });

    it('should scope lookup to both saleId and galleryId for tenant isolation', async () => {
      vi.mocked(prisma.sale.findFirst).mockResolvedValue(mockSale as any);

      await service.getById(SALE_ID, GALLERY_ID);

      expect(prisma.sale.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: SALE_ID, galleryId: GALLERY_ID }),
        }),
      );
    });

    it('should throw NotFoundError when sale does not exist', async () => {
      vi.mocked(prisma.sale.findFirst).mockResolvedValue(null);

      await expect(service.getById('bad-id', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include the sale ID in the NotFoundError message when missing', async () => {
      vi.mocked(prisma.sale.findFirst).mockResolvedValue(null);

      await expect(service.getById('missing-sale-id', GALLERY_ID)).rejects.toThrow(
        'missing-sale-id',
      );
    });

    it('should throw NotFoundError when sale belongs to a different gallery (tenant isolation)', async () => {
      vi.mocked(prisma.sale.findFirst).mockResolvedValue(null);

      await expect(service.getById(SALE_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------------------- //
  // create
  // ---------------------------------------------------------------- //
  describe('create', () => {
    const createInput = {
      vehicleId: VEHICLE_ID,
      customerId: CUSTOMER_ID,
      salePrice: 15000,
      paymentMethod: 'CASH' as const,
      notes: 'Great deal',
    };

    it('should create a sale and return it with vehicle and customer data', async () => {
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle);
      txMock.sale.findFirst.mockResolvedValueOnce(null); // no existing sale (duplicate check)
      txMock.customer.findFirst.mockResolvedValue(mockCustomer);
      txMock.sale.create.mockResolvedValue(mockSale);
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      const result = await service.create(createInput, GALLERY_ID, USER_ID);

      expect(result.id).toBe(SALE_ID);
    });

    it('should calculate profit as salePrice minus totalCost', async () => {
      // totalCost = 12000, salePrice = 15000 → profit = 3000
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle);
      txMock.sale.findFirst.mockResolvedValueOnce(null);
      txMock.customer.findFirst.mockResolvedValue(mockCustomer);
      txMock.sale.create.mockResolvedValue(mockSale);
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.create(createInput, GALLERY_ID, USER_ID);

      const call = txMock.sale.create.mock.calls[0][0] as any;
      expect(Number(call.data.profit)).toBe(3000);
    });

    it('should calculate profitMargin as (profit / salePrice) * 100', async () => {
      // profit = 3000, salePrice = 15000 → profitMargin = 20
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle);
      txMock.sale.findFirst.mockResolvedValueOnce(null);
      txMock.customer.findFirst.mockResolvedValue(mockCustomer);
      txMock.sale.create.mockResolvedValue(mockSale);
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.create(createInput, GALLERY_ID, USER_ID);

      const call = txMock.sale.create.mock.calls[0][0] as any;
      expect(Number(call.data.profitMargin)).toBeCloseTo(20);
    });

    it('should calculate profitMargin as 0 when salePrice is 0 (division by zero guard)', async () => {
      const vehicleWithZeroCost = {
        ...mockVehicle,
        totalCost: new Prisma.Decimal(0),
      };
      txMock.vehicle.findFirst.mockResolvedValue(vehicleWithZeroCost);
      txMock.sale.findFirst.mockResolvedValueOnce(null);
      txMock.customer.findFirst.mockResolvedValue(mockCustomer);
      txMock.sale.create.mockResolvedValue(mockSale);
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.create({ ...createInput, salePrice: 0 }, GALLERY_ID, USER_ID);

      const call = txMock.sale.create.mock.calls[0][0] as any;
      expect(Number(call.data.profitMargin)).toBe(0);
    });

    it('should use vehicle.totalCost as vehicleTotalCost when it is set', async () => {
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle); // totalCost = 12000
      txMock.sale.findFirst.mockResolvedValueOnce(null);
      txMock.customer.findFirst.mockResolvedValue(mockCustomer);
      txMock.sale.create.mockResolvedValue(mockSale);
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.create(createInput, GALLERY_ID, USER_ID);

      const call = txMock.sale.create.mock.calls[0][0] as any;
      expect(Number(call.data.totalCost)).toBe(12000);
    });

    it('should fall back to fobPrice + additionalExpenses when totalCost is null', async () => {
      const vehicleNoTotalCost = {
        ...mockVehicle,
        totalCost: null,
        fobPrice: new Prisma.Decimal(10000),
        additionalExpenses: new Prisma.Decimal(500),
      };
      txMock.vehicle.findFirst.mockResolvedValue(vehicleNoTotalCost);
      txMock.sale.findFirst.mockResolvedValueOnce(null);
      txMock.customer.findFirst.mockResolvedValue(mockCustomer);
      txMock.sale.create.mockResolvedValue(mockSale);
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.create(createInput, GALLERY_ID, USER_ID);

      const call = txMock.sale.create.mock.calls[0][0] as any;
      expect(Number(call.data.totalCost)).toBe(10500); // 10000 + 500
    });

    it('should update vehicle status to SOLD within the transaction', async () => {
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle);
      txMock.sale.findFirst.mockResolvedValueOnce(null);
      txMock.customer.findFirst.mockResolvedValue(mockCustomer);
      txMock.sale.create.mockResolvedValue(mockSale);
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.create(createInput, GALLERY_ID, USER_ID);

      expect(txMock.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VEHICLE_ID, galleryId: GALLERY_ID },
          data: expect.objectContaining({ status: 'SOLD' }),
        }),
      );
    });

    it('should use provided saleDate when given', async () => {
      const dateInput = { ...createInput, saleDate: '2024-03-15T10:00:00.000Z' };
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle);
      txMock.sale.findFirst.mockResolvedValueOnce(null);
      txMock.customer.findFirst.mockResolvedValue(mockCustomer);
      txMock.sale.create.mockResolvedValue(mockSale);
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.create(dateInput, GALLERY_ID, USER_ID);

      const call = txMock.sale.create.mock.calls[0][0] as any;
      expect(call.data.saleDate).toEqual(new Date('2024-03-15T10:00:00.000Z'));
    });

    it('should default saleDate to now when not provided', async () => {
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle);
      txMock.sale.findFirst.mockResolvedValueOnce(null);
      txMock.customer.findFirst.mockResolvedValue(mockCustomer);
      txMock.sale.create.mockResolvedValue(mockSale);
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      const before = new Date();
      await service.create(createInput, GALLERY_ID, USER_ID);
      const after = new Date();

      const call = txMock.sale.create.mock.calls[0][0] as any;
      expect(call.data.saleDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(call.data.saleDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw NotFoundError when vehicle does not exist', async () => {
      txMock.vehicle.findFirst.mockResolvedValue(null);

      await expect(service.create(createInput, GALLERY_ID, USER_ID)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw NotFoundError when vehicle belongs to a different gallery (tenant isolation)', async () => {
      // gallery check is done via findFirst(where: { id, galleryId }) inside tx
      txMock.vehicle.findFirst.mockResolvedValue(null);

      await expect(service.create(createInput, OTHER_GALLERY_ID, USER_ID)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw BadRequestError when vehicle status is not IN_STOCK', async () => {
      const soldVehicle = { ...mockVehicle, status: 'SOLD' };
      txMock.vehicle.findFirst.mockResolvedValue(soldVehicle);

      await expect(service.create(createInput, GALLERY_ID, USER_ID)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('should include the vehicle status in the BadRequestError message when not IN_STOCK', async () => {
      const transitVehicle = { ...mockVehicle, status: 'IN_TRANSIT' };
      txMock.vehicle.findFirst.mockResolvedValue(transitVehicle);

      await expect(service.create(createInput, GALLERY_ID, USER_ID)).rejects.toThrow('IN_TRANSIT');
    });

    it('should throw BadRequestError when vehicle already has an active sale record', async () => {
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle);
      txMock.sale.findFirst.mockResolvedValueOnce(mockSale); // existing sale found by duplicate check!

      await expect(service.create(createInput, GALLERY_ID, USER_ID)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('should throw NotFoundError when customer does not exist or belongs to a different gallery', async () => {
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle);
      txMock.sale.findFirst.mockResolvedValueOnce(null);
      txMock.customer.findFirst.mockResolvedValue(null);

      await expect(service.create(createInput, GALLERY_ID, USER_ID)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should call auditService.log after successful sale creation', async () => {
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle);
      txMock.sale.findFirst.mockResolvedValueOnce(null);
      txMock.customer.findFirst.mockResolvedValue(mockCustomer);
      txMock.sale.create.mockResolvedValue(mockSale);
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.create(createInput, GALLERY_ID, USER_ID);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entityType: 'Sale',
          entityId: SALE_ID,
        }),
      );
    });

    it('should emit SALE_CREATED and VEHICLE_SOLD socket events after creation', async () => {
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle);
      txMock.sale.findFirst.mockResolvedValueOnce(null);
      txMock.customer.findFirst.mockResolvedValue(mockCustomer);
      txMock.sale.create.mockResolvedValue(mockSale);
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.create(createInput, GALLERY_ID, USER_ID);

      expect(emitToGallery).toHaveBeenCalledWith(
        GALLERY_ID,
        'sale:created',
        expect.objectContaining({ id: SALE_ID }),
      );
      expect(emitToGallery).toHaveBeenCalledWith(
        GALLERY_ID,
        'vehicle:sold',
        expect.objectContaining({ id: VEHICLE_ID }),
      );
    });

    it('should not throw when socket emit fails during create (graceful error handling)', async () => {
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle);
      txMock.sale.findFirst.mockResolvedValueOnce(null);
      txMock.customer.findFirst.mockResolvedValue(mockCustomer);
      txMock.sale.create.mockResolvedValue(mockSale);
      txMock.vehicle.update.mockResolvedValue(mockVehicle);
      vi.mocked(emitToGallery).mockImplementation(() => {
        throw new Error('socket down');
      });

      await expect(service.create(createInput, GALLERY_ID, USER_ID)).resolves.toBeDefined();
    });
  });

  // ---------------------------------------------------------------- //
  // update
  // ---------------------------------------------------------------- //
  describe('update', () => {
    const updateInput = {
      salePrice: 16000,
      paymentMethod: 'BANK_TRANSFER' as const,
      notes: 'Adjusted price',
    };

    const existingSale = {
      ...mockSale,
      id: SALE_ID,
      vehicleId: VEHICLE_ID,
      galleryId: GALLERY_ID,
      totalCost: new Prisma.Decimal(12000),
      salePrice: new Prisma.Decimal(15000),
    };

    it('should update and return the modified sale', async () => {
      txMock.sale.findFirst.mockResolvedValue(existingSale as any);
      txMock.sale.update.mockResolvedValue({ ...mockSale, salePrice: new Prisma.Decimal(16000) });
      txMock.vehicle.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.update(SALE_ID, updateInput, GALLERY_ID);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundError when sale does not exist', async () => {
      txMock.sale.findFirst.mockResolvedValue(null);

      await expect(service.update('bad-id', updateInput, GALLERY_ID)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw NotFoundError when sale belongs to a different gallery (tenant isolation)', async () => {
      txMock.sale.findFirst.mockResolvedValue(null);

      await expect(service.update(SALE_ID, updateInput, OTHER_GALLERY_ID)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should recalculate profit when salePrice is updated', async () => {
      // existingSale.totalCost = 12000, new salePrice = 16000 → profit = 4000
      txMock.sale.findFirst.mockResolvedValue(existingSale as any);
      txMock.sale.update.mockResolvedValue(mockSale);
      txMock.vehicle.updateMany.mockResolvedValue({ count: 1 });

      await service.update(SALE_ID, { salePrice: 16000 }, GALLERY_ID);

      const call = txMock.sale.update.mock.calls[0][0] as any;
      expect(Number(call.data.profit)).toBe(4000);
    });

    it('should recalculate profitMargin when salePrice is updated', async () => {
      // profit = 4000, salePrice = 16000 → profitMargin = 25
      txMock.sale.findFirst.mockResolvedValue(existingSale as any);
      txMock.sale.update.mockResolvedValue(mockSale);
      txMock.vehicle.updateMany.mockResolvedValue({ count: 1 });

      await service.update(SALE_ID, { salePrice: 16000 }, GALLERY_ID);

      const call = txMock.sale.update.mock.calls[0][0] as any;
      expect(Number(call.data.profitMargin)).toBeCloseTo(25);
    });

    it('should keep existing salePrice when salePrice is not in update input', async () => {
      txMock.sale.findFirst.mockResolvedValue(existingSale as any);
      txMock.sale.update.mockResolvedValue(mockSale);

      await service.update(SALE_ID, { notes: 'Just updating notes' }, GALLERY_ID);

      const call = txMock.sale.update.mock.calls[0][0] as any;
      expect(call.data.salePrice).toBeUndefined();
    });

    it('should also update vehicle salePrice and profit fields when salePrice changes', async () => {
      txMock.sale.findFirst.mockResolvedValue(existingSale as any);
      txMock.sale.update.mockResolvedValue(mockSale);
      txMock.vehicle.updateMany.mockResolvedValue({ count: 1 });

      await service.update(SALE_ID, { salePrice: 16000 }, GALLERY_ID);

      expect(txMock.vehicle.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VEHICLE_ID, galleryId: GALLERY_ID },
          data: expect.objectContaining({
            salePrice: expect.any(Prisma.Decimal),
            profit: expect.any(Prisma.Decimal),
            profitMargin: expect.any(Prisma.Decimal),
          }),
        }),
      );
    });

    it('should not update vehicle when salePrice is not changed', async () => {
      txMock.sale.findFirst.mockResolvedValue(existingSale as any);
      txMock.sale.update.mockResolvedValue(mockSale);

      await service.update(SALE_ID, { notes: 'Only notes' }, GALLERY_ID);

      expect(txMock.vehicle.updateMany).not.toHaveBeenCalled();
    });

    it('should update paymentType when paymentMethod is provided', async () => {
      txMock.sale.findFirst.mockResolvedValue(existingSale as any);
      txMock.sale.update.mockResolvedValue(mockSale);
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.update(SALE_ID, { paymentMethod: 'CREDIT_CARD' }, GALLERY_ID);

      const call = txMock.sale.update.mock.calls[0][0] as any;
      expect(call.data.paymentType).toBe('CREDIT_CARD');
    });

    it('should update notes when notes is provided', async () => {
      txMock.sale.findFirst.mockResolvedValue(existingSale as any);
      txMock.sale.update.mockResolvedValue(mockSale);

      await service.update(SALE_ID, { notes: 'New notes' }, GALLERY_ID);

      const call = txMock.sale.update.mock.calls[0][0] as any;
      expect(call.data.notes).toBe('New notes');
    });
  });

  // ---------------------------------------------------------------- //
  // cancel
  // ---------------------------------------------------------------- //
  describe('cancel', () => {
    const saleForCancel = {
      id: SALE_ID,
      vehicleId: VEHICLE_ID,
      salePrice: new Prisma.Decimal(15000),
      galleryId: GALLERY_ID,
      vehicle: {
        id: VEHICLE_ID,
        brand: 'Toyota',
        model: 'Corolla',
        year: 2022,
      },
    };

    it('should cancel the sale and return success message with id', async () => {
      txMock.sale.findFirst.mockResolvedValue(saleForCancel as any);
      txMock.sale.deleteMany.mockResolvedValue({ count: 1 });
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      const result = await service.cancel(SALE_ID, GALLERY_ID, USER_ID);

      expect(result.id).toBe(SALE_ID);
      expect(result.message).toContain('cancelled');
    });

    it('should throw NotFoundError when sale does not exist', async () => {
      txMock.sale.findFirst.mockResolvedValue(null);

      await expect(service.cancel('bad-id', GALLERY_ID, USER_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include the sale ID in the NotFoundError message when missing', async () => {
      txMock.sale.findFirst.mockResolvedValue(null);

      await expect(service.cancel('missing-sale', GALLERY_ID, USER_ID)).rejects.toThrow(
        'missing-sale',
      );
    });

    it('should throw NotFoundError when sale belongs to a different gallery (tenant isolation)', async () => {
      txMock.sale.findFirst.mockResolvedValue(null);

      await expect(service.cancel(SALE_ID, OTHER_GALLERY_ID, USER_ID)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should delete the sale record within the transaction', async () => {
      txMock.sale.findFirst.mockResolvedValue(saleForCancel as any);
      txMock.sale.deleteMany.mockResolvedValue({ count: 1 });
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.cancel(SALE_ID, GALLERY_ID, USER_ID);

      expect(txMock.sale.deleteMany).toHaveBeenCalledWith({ where: { id: SALE_ID, galleryId: GALLERY_ID } });
    });

    it('should update vehicle status back to IN_STOCK within the transaction', async () => {
      txMock.sale.findFirst.mockResolvedValue(saleForCancel as any);
      txMock.sale.deleteMany.mockResolvedValue({ count: 1 });
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.cancel(SALE_ID, GALLERY_ID, USER_ID);

      expect(txMock.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VEHICLE_ID, galleryId: GALLERY_ID },
          data: expect.objectContaining({ status: 'IN_STOCK' }),
        }),
      );
    });

    it('should clear vehicle sale fields (soldDate, salePrice, profit, profitMargin) on cancel', async () => {
      txMock.sale.findFirst.mockResolvedValue(saleForCancel as any);
      txMock.sale.deleteMany.mockResolvedValue({ count: 1 });
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.cancel(SALE_ID, GALLERY_ID, USER_ID);

      const call = txMock.vehicle.update.mock.calls[0][0] as any;
      expect(call.data.soldDate).toBeNull();
      expect(call.data.salePrice).toBeNull();
      expect(call.data.profit).toBeNull();
      expect(call.data.profitMargin).toBeNull();
    });

    it('should call auditService.log with CANCEL action after cancellation', async () => {
      txMock.sale.findFirst.mockResolvedValue(saleForCancel as any);
      txMock.sale.deleteMany.mockResolvedValue({ count: 1 });
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.cancel(SALE_ID, GALLERY_ID, USER_ID);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CANCEL',
          entityType: 'Sale',
          entityId: SALE_ID,
        }),
      );
    });

    it('should emit SALE_CANCELLED socket event after cancellation', async () => {
      txMock.sale.findFirst.mockResolvedValue(saleForCancel as any);
      txMock.sale.deleteMany.mockResolvedValue({ count: 1 });
      txMock.vehicle.update.mockResolvedValue(mockVehicle);

      await service.cancel(SALE_ID, GALLERY_ID, USER_ID);

      expect(emitToGallery).toHaveBeenCalledWith(
        GALLERY_ID,
        'sale:cancelled',
        expect.objectContaining({ id: SALE_ID, vehicleId: VEHICLE_ID }),
      );
    });

    it('should not throw when socket emit fails during cancel (graceful error handling)', async () => {
      txMock.sale.findFirst.mockResolvedValue(saleForCancel as any);
      txMock.sale.deleteMany.mockResolvedValue({ count: 1 });
      txMock.vehicle.update.mockResolvedValue(mockVehicle);
      vi.mocked(emitToGallery).mockImplementation(() => {
        throw new Error('socket timeout');
      });

      await expect(service.cancel(SALE_ID, GALLERY_ID, USER_ID)).resolves.toBeDefined();
    });
  });

  // ---------------------------------------------------------------- //
  // getStats
  // ---------------------------------------------------------------- //
  describe('getStats', () => {
    it('should return total sales count for the gallery', async () => {
      vi.mocked(prisma.sale.aggregate).mockResolvedValue({
        _count: { _all: 5 },
        _sum: {
          salePrice: new Prisma.Decimal(75000),
          profit: new Prisma.Decimal(15000),
          profitMargin: null,
        },
        _avg: { profitMargin: new Prisma.Decimal(20) },
      } as any);
      vi.mocked(prisma.sale.count).mockResolvedValue(2);

      const result = await service.getStats(GALLERY_ID);

      expect(result.totalSales).toBe(5);
    });

    it('should return total revenue (sum of salePrice)', async () => {
      vi.mocked(prisma.sale.aggregate).mockResolvedValue({
        _count: { _all: 3 },
        _sum: {
          salePrice: new Prisma.Decimal(45000),
          profit: new Prisma.Decimal(9000),
          profitMargin: null,
        },
        _avg: { profitMargin: new Prisma.Decimal(20) },
      } as any);
      vi.mocked(prisma.sale.count).mockResolvedValue(1);

      const result = await service.getStats(GALLERY_ID);

      expect(result.totalRevenue).toBe(45000);
    });

    it('should return total profit', async () => {
      vi.mocked(prisma.sale.aggregate).mockResolvedValue({
        _count: { _all: 3 },
        _sum: {
          salePrice: new Prisma.Decimal(45000),
          profit: new Prisma.Decimal(9000),
          profitMargin: null,
        },
        _avg: { profitMargin: new Prisma.Decimal(20) },
      } as any);
      vi.mocked(prisma.sale.count).mockResolvedValue(1);

      const result = await service.getStats(GALLERY_ID);

      expect(result.totalProfit).toBe(9000);
    });

    it('should return average profit margin', async () => {
      vi.mocked(prisma.sale.aggregate).mockResolvedValue({
        _count: { _all: 3 },
        _sum: { salePrice: null, profit: null, profitMargin: null },
        _avg: { profitMargin: new Prisma.Decimal(18.5) },
      } as any);
      vi.mocked(prisma.sale.count).mockResolvedValue(0);

      const result = await service.getStats(GALLERY_ID);

      expect(result.averageProfitMargin).toBeCloseTo(18.5);
    });

    it('should return current month sale count', async () => {
      vi.mocked(prisma.sale.aggregate).mockResolvedValue({
        _count: { _all: 10 },
        _sum: { salePrice: null, profit: null, profitMargin: null },
        _avg: { profitMargin: null },
      } as any);
      vi.mocked(prisma.sale.count).mockResolvedValue(3);

      const result = await service.getStats(GALLERY_ID);

      expect(result.currentMonthSales).toBe(3);
    });

    it('should return zeroes when gallery has no sales', async () => {
      vi.mocked(prisma.sale.aggregate).mockResolvedValue({
        _count: { _all: 0 },
        _sum: { salePrice: null, profit: null, profitMargin: null },
        _avg: { profitMargin: null },
      } as any);
      vi.mocked(prisma.sale.count).mockResolvedValue(0);

      const result = await service.getStats(GALLERY_ID);

      expect(result.totalSales).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.totalProfit).toBe(0);
      expect(result.averageProfitMargin).toBe(0);
      expect(result.currentMonthSales).toBe(0);
    });

    it('should scope aggregate query to galleryId for tenant isolation', async () => {
      vi.mocked(prisma.sale.aggregate).mockResolvedValue({
        _count: { _all: 0 },
        _sum: { salePrice: null, profit: null, profitMargin: null },
        _avg: { profitMargin: null },
      } as any);
      vi.mocked(prisma.sale.count).mockResolvedValue(0);

      await service.getStats(GALLERY_ID);

      expect(prisma.sale.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { galleryId: GALLERY_ID } }),
      );
    });
  });
});
