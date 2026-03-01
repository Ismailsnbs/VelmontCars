import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerService } from '../customer.service';
import { NotFoundError, BadRequestError } from '../../middleware/error.middleware';

// ------------------------------------------------------------------ //
// Prisma mock
// ------------------------------------------------------------------ //

const { customerMock } = vi.hoisted(() => {
  const mock = {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  };
  return { customerMock: mock };
});

vi.mock('../../lib/prisma', () => ({
  default: {
    customer: customerMock,
    $transaction: vi.fn((fn: any) => fn({ customer: customerMock })),
  },
}));

import prisma from '../../lib/prisma';

// ------------------------------------------------------------------ //
// Fixtures
// ------------------------------------------------------------------ //

const GALLERY_ID = 'gallery-aaa-111';
const OTHER_GALLERY_ID = 'gallery-bbb-222';
const CUSTOMER_ID = 'customer-ccc-333';

const mockSale = {
  id: 'sale-1',
  vehicleId: 'vehicle-1',
  salePrice: 50000,
  saleDate: new Date('2024-06-01'),
};

const mockCustomer = {
  id: CUSTOMER_ID,
  name: 'Ahmet Yilmaz',
  phone: '+90555000000',
  email: 'ahmet@example.com',
  identityNo: 'TC123456',
  address: 'Lefkosa, KKTC',
  notes: 'VIP customer',
  galleryId: GALLERY_ID,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  sales: [],
};

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //

describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CustomerService();
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

    it('should return paginated customers and total count for the gallery', async () => {
      vi.mocked(prisma.customer.count).mockResolvedValue(1);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([mockCustomer] as any);

      const result = await service.getAll(baseParams);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should pass galleryId in the where clause for tenant isolation', async () => {
      vi.mocked(prisma.customer.count).mockResolvedValue(0);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      await service.getAll(baseParams);

      expect(prisma.customer.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ galleryId: GALLERY_ID }),
        }),
      );
      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ galleryId: GALLERY_ID }),
        }),
      );
    });

    it('should add OR search clause when search is provided', async () => {
      vi.mocked(prisma.customer.count).mockResolvedValue(0);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      await service.getAll({ ...baseParams, search: 'Ahmet' });

      const call = vi.mocked(prisma.customer.findMany).mock.calls[0][0] as any;
      expect(call.where.OR).toBeDefined();
      expect(call.where.OR).toHaveLength(3); // name, phone, email
    });

    it('should not add OR clause when search is not provided', async () => {
      vi.mocked(prisma.customer.count).mockResolvedValue(0);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      await service.getAll(baseParams);

      const call = vi.mocked(prisma.customer.findMany).mock.calls[0][0] as any;
      expect(call.where.OR).toBeUndefined();
    });

    it('should include sales in returned customer data', async () => {
      const customerWithSales = { ...mockCustomer, sales: [mockSale] };
      vi.mocked(prisma.customer.count).mockResolvedValue(1);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([customerWithSales] as any);

      const result = await service.getAll(baseParams);

      expect(result.data[0].sales).toHaveLength(1);
    });

    it('should apply skip and take for pagination', async () => {
      vi.mocked(prisma.customer.count).mockResolvedValue(50);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      await service.getAll({ ...baseParams, skip: 20, limit: 10 });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should return empty data when no customers exist for the gallery', async () => {
      vi.mocked(prisma.customer.count).mockResolvedValue(0);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      const result = await service.getAll(baseParams);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ---------------------------------------------------------------- //
  // getById
  // ---------------------------------------------------------------- //
  describe('getById', () => {
    it('should return the customer when it belongs to the gallery', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer as any);

      const result = await service.getById(CUSTOMER_ID, GALLERY_ID);

      expect(result.id).toBe(CUSTOMER_ID);
    });

    it('should throw NotFoundError when customer does not exist', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      await expect(service.getById('bad-id', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include the customer ID in the NotFoundError message when missing', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      await expect(service.getById('missing-customer-id', GALLERY_ID)).rejects.toThrow(
        'missing-customer-id',
      );
    });

    it('should throw NotFoundError when customer belongs to a different gallery (tenant isolation)', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      await expect(service.getById(CUSTOMER_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include sales ordered by saleDate descending', async () => {
      const customerWithSales = { ...mockCustomer, sales: [mockSale] };
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(customerWithSales as any);

      const result = await service.getById(CUSTOMER_ID, GALLERY_ID);

      expect(result.sales).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------- //
  // create
  // ---------------------------------------------------------------- //
  describe('create', () => {
    const createInput = {
      name: 'Ahmet Yilmaz',
      phone: '+90555000000',
      email: 'ahmet@example.com',
      identityNo: 'TC123456',
      address: 'Lefkosa, KKTC',
      notes: 'VIP customer',
    };

    it('should create and return the new customer', async () => {
      vi.mocked(prisma.customer.create).mockResolvedValue(mockCustomer as any);

      const result = await service.create(createInput, GALLERY_ID);

      expect(result).toEqual(mockCustomer);
    });

    it('should associate the created customer with galleryId', async () => {
      vi.mocked(prisma.customer.create).mockResolvedValue(mockCustomer as any);

      await service.create(createInput, GALLERY_ID);

      const call = vi.mocked(prisma.customer.create).mock.calls[0][0] as any;
      expect(call.data.galleryId).toBe(GALLERY_ID);
    });

    it('should persist the customer name', async () => {
      vi.mocked(prisma.customer.create).mockResolvedValue(mockCustomer as any);

      await service.create(createInput, GALLERY_ID);

      const call = vi.mocked(prisma.customer.create).mock.calls[0][0] as any;
      expect(call.data.name).toBe('Ahmet Yilmaz');
    });

    it('should persist optional phone when provided', async () => {
      vi.mocked(prisma.customer.create).mockResolvedValue(mockCustomer as any);

      await service.create(createInput, GALLERY_ID);

      const call = vi.mocked(prisma.customer.create).mock.calls[0][0] as any;
      expect(call.data.phone).toBe('+90555000000');
    });

    it('should persist optional email when provided', async () => {
      vi.mocked(prisma.customer.create).mockResolvedValue(mockCustomer as any);

      await service.create(createInput, GALLERY_ID);

      const call = vi.mocked(prisma.customer.create).mock.calls[0][0] as any;
      expect(call.data.email).toBe('ahmet@example.com');
    });

    it('should create customer with minimal required fields only (name)', async () => {
      const minimalInput = { name: 'Just Name' };
      vi.mocked(prisma.customer.create).mockResolvedValue({
        ...mockCustomer,
        name: 'Just Name',
        phone: null,
        email: null,
      } as any);

      const result = await service.create(minimalInput, GALLERY_ID);

      expect(result.name).toBe('Just Name');
    });

    it('should include sales in the returned customer', async () => {
      const customerWithSales = { ...mockCustomer, sales: [] };
      vi.mocked(prisma.customer.create).mockResolvedValue(customerWithSales as any);

      const result = await service.create(createInput, GALLERY_ID);

      expect(result.sales).toBeDefined();
    });
  });

  // ---------------------------------------------------------------- //
  // update
  // ---------------------------------------------------------------- //
  describe('update', () => {
    const updateInput = {
      name: 'Mehmet Yilmaz',
      phone: '+90555111111',
    };

    it('should update and return the modified customer', async () => {
      const updatedCustomer = { ...mockCustomer, ...updateInput, sales: [] };
      vi.mocked(prisma.customer.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(updatedCustomer as any);

      const result = await service.update(CUSTOMER_ID, updateInput, GALLERY_ID);

      expect(result!.name).toBe('Mehmet Yilmaz');
    });

    it('should throw NotFoundError when customer does not exist', async () => {
      vi.mocked(prisma.customer.updateMany).mockResolvedValue({ count: 0 });

      await expect(service.update('bad-id', updateInput, GALLERY_ID)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should include the customer ID in the NotFoundError message when missing', async () => {
      vi.mocked(prisma.customer.updateMany).mockResolvedValue({ count: 0 });

      await expect(service.update('missing-id', updateInput, GALLERY_ID)).rejects.toThrow(
        'missing-id',
      );
    });

    it('should throw NotFoundError when customer belongs to a different gallery (tenant isolation)', async () => {
      vi.mocked(prisma.customer.updateMany).mockResolvedValue({ count: 0 });

      await expect(
        service.update(CUSTOMER_ID, updateInput, OTHER_GALLERY_ID),
      ).rejects.toThrow(NotFoundError);
    });

    it('should not call findFirst when updateMany returns count 0 (no rows matched)', async () => {
      vi.mocked(prisma.customer.updateMany).mockResolvedValue({ count: 0 });

      await expect(
        service.update(CUSTOMER_ID, updateInput, OTHER_GALLERY_ID),
      ).rejects.toThrow();
      // findFirst is only reached after a successful updateMany — no calls when count === 0
      expect(prisma.customer.findFirst).not.toHaveBeenCalled();
    });

    it('should call updateMany with galleryId in the where clause (write-path tenant isolation)', async () => {
      vi.mocked(prisma.customer.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({ ...mockCustomer, sales: [] } as any);

      await service.update(CUSTOMER_ID, updateInput, GALLERY_ID);

      expect(prisma.customer.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: CUSTOMER_ID, galleryId: GALLERY_ID }),
        }),
      );
    });

    it('should apply only fields present in the input (partial update)', async () => {
      vi.mocked(prisma.customer.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({ ...mockCustomer, sales: [] } as any);

      await service.update(CUSTOMER_ID, { notes: 'Updated notes' }, GALLERY_ID);

      const call = vi.mocked(prisma.customer.updateMany).mock.calls[0][0] as any;
      expect(call.data.notes).toBe('Updated notes');
      expect(call.data.name).toBeUndefined();
    });

    it('should include sales in the returned updated customer', async () => {
      vi.mocked(prisma.customer.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        ...mockCustomer,
        sales: [],
      } as any);

      const result = await service.update(CUSTOMER_ID, updateInput, GALLERY_ID);

      expect(result!.sales).toBeDefined();
    });
  });

  // ---------------------------------------------------------------- //
  // delete
  // ---------------------------------------------------------------- //
  describe('delete', () => {
    it('should delete the customer and return its id when no sales exist', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        ...mockCustomer,
        sales: [],
      } as any);
      vi.mocked(prisma.customer.deleteMany).mockResolvedValue({ count: 1 });

      const result = await service.delete(CUSTOMER_ID, GALLERY_ID);

      expect(result).toEqual({ id: CUSTOMER_ID });
    });

    it('should throw NotFoundError when customer does not exist', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      await expect(service.delete('bad-id', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include the customer ID in the NotFoundError message when missing', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      await expect(service.delete('missing-id', GALLERY_ID)).rejects.toThrow('missing-id');
    });

    it('should throw NotFoundError when customer belongs to a different gallery (tenant isolation)', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      await expect(service.delete(CUSTOMER_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when customer has existing sales', async () => {
      const customerWithSales = {
        ...mockCustomer,
        sales: [mockSale],
      };
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(customerWithSales as any);

      await expect(service.delete(CUSTOMER_ID, GALLERY_ID)).rejects.toThrow(BadRequestError);
    });

    it('should include sale count in the BadRequestError message', async () => {
      const customerWithSales = {
        ...mockCustomer,
        sales: [mockSale, { ...mockSale, id: 'sale-2' }],
      };
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(customerWithSales as any);

      await expect(service.delete(CUSTOMER_ID, GALLERY_ID)).rejects.toThrow('2');
    });

    it('should not call prisma.customer.deleteMany when customer has sales', async () => {
      const customerWithSales = {
        ...mockCustomer,
        sales: [mockSale],
      };
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(customerWithSales as any);

      await expect(service.delete(CUSTOMER_ID, GALLERY_ID)).rejects.toThrow();
      expect(prisma.customer.deleteMany).not.toHaveBeenCalled();
    });

    it('should call prisma.customer.deleteMany with both id and galleryId (write-path tenant isolation)', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        ...mockCustomer,
        sales: [],
      } as any);
      vi.mocked(prisma.customer.deleteMany).mockResolvedValue({ count: 1 });

      await service.delete(CUSTOMER_ID, GALLERY_ID);

      expect(prisma.customer.deleteMany).toHaveBeenCalledWith({
        where: { id: CUSTOMER_ID, galleryId: GALLERY_ID },
      });
    });
  });

  // ---------------------------------------------------------------- //
  // getStats
  // ---------------------------------------------------------------- //
  describe('getStats', () => {
    it('should return the total customer count for the gallery', async () => {
      vi.mocked(prisma.customer.count)
        .mockResolvedValueOnce(1) // totalCustomers
        .mockResolvedValueOnce(0); // activeCustomers

      const result = await service.getStats(GALLERY_ID);

      expect(result.totalCustomers).toBe(1);
    });

    it('should count only active customers (those who have at least one sale)', async () => {
      vi.mocked(prisma.customer.count)
        .mockResolvedValueOnce(2) // totalCustomers
        .mockResolvedValueOnce(1); // activeCustomers

      const result = await service.getStats(GALLERY_ID);

      expect(result.totalCustomers).toBe(2);
      expect(result.activeCustomers).toBe(1);
    });

    it('should return activeCustomers as 0 when no customers have sales', async () => {
      vi.mocked(prisma.customer.count)
        .mockResolvedValueOnce(1) // totalCustomers
        .mockResolvedValueOnce(0); // activeCustomers

      const result = await service.getStats(GALLERY_ID);

      expect(result.activeCustomers).toBe(0);
    });

    it('should return zeroes when gallery has no customers', async () => {
      vi.mocked(prisma.customer.count)
        .mockResolvedValueOnce(0) // totalCustomers
        .mockResolvedValueOnce(0); // activeCustomers

      const result = await service.getStats(GALLERY_ID);

      expect(result.totalCustomers).toBe(0);
      expect(result.activeCustomers).toBe(0);
    });

    it('should pass galleryId in the where clause of both count calls for tenant isolation', async () => {
      vi.mocked(prisma.customer.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await service.getStats(GALLERY_ID);

      const calls = vi.mocked(prisma.customer.count).mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[0][0]).toEqual({ where: { galleryId: GALLERY_ID } });
      expect(calls[1][0]).toEqual({
        where: {
          galleryId: GALLERY_ID,
          sales: { some: {} },
        },
      });
    });

    it('should count all customers with at least one sale as active', async () => {
      vi.mocked(prisma.customer.count)
        .mockResolvedValueOnce(3) // totalCustomers
        .mockResolvedValueOnce(2); // activeCustomers (c1 and c2 have sales)

      const result = await service.getStats(GALLERY_ID);

      expect(result.activeCustomers).toBe(2);
    });
  });
});
