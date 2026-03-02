// Customer CRUD service with multi-tenant isolation
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';
import { CreateCustomerInput, UpdateCustomerInput } from '../validations/customer.validation';

interface GetAllParams {
  galleryId: string;
  page: number;
  limit: number;
  skip: number;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export class CustomerService {
  /**
   * Get all customers for a gallery with pagination and filtering
   * Multi-tenant: filtered by galleryId
   */
  async getAll(params: GetAllParams) {
    const where: Prisma.CustomerWhereInput = {
      galleryId: params.galleryId,
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.customer.count({ where });

    const data = await prisma.customer.findMany({
      where,
      orderBy: {
        [params.sortBy]: params.sortOrder,
      },
      include: {
        sales: {
          select: {
            id: true,
            vehicleId: true,
            salePrice: true,
            saleDate: true,
          },
        },
      },
      skip: params.skip,
      take: params.limit,
    });

    return { data, total };
  }

  /**
   * Get a single customer by ID with sales
   * Multi-tenant: checks galleryId
   */
  async getById(id: string, galleryId: string) {
    // SECURITY: findFirst with compound { id, galleryId } enforces tenant isolation atomically at DB level
    const customer = await prisma.customer.findFirst({
      where: { id, galleryId },
      include: {
        sales: {
          orderBy: { saleDate: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  /**
   * Create a new customer
   * Multi-tenant: associates with galleryId
   */
  async create(input: CreateCustomerInput, galleryId: string) {
    const customer = await prisma.customer.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email,
        identityNo: input.identityNo,
        address: input.address,
        notes: input.notes,
        galleryId,
      },
      include: {
        sales: true,
      },
    });

    return customer;
  }

  /**
   * Update a customer
   * Multi-tenant: checks galleryId on both read and write paths (defense-in-depth)
   */
  async update(id: string, input: UpdateCustomerInput, galleryId: string) {
    // SECURITY: updateMany with compound { id, galleryId } enforces tenant isolation on the write
    // path itself — not just the preceding read. count === 0 means either the record does not
    // exist or it belongs to a different gallery; both are surfaced as NotFoundError.
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.customer.updateMany({
        where: { id, galleryId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.email !== undefined && { email: input.email }),
          ...(input.identityNo !== undefined && { identityNo: input.identityNo }),
          ...(input.address !== undefined && { address: input.address }),
          ...(input.notes !== undefined && { notes: input.notes }),
        },
      });

      if (result.count === 0) {
        throw new NotFoundError(`Customer with ID ${id} not found`);
      }

      return tx.customer.findFirst({
        where: { id, galleryId },
        include: { sales: true },
      });
    });

    return updated;
  }

  /**
   * Delete a customer
   * Multi-tenant: checks galleryId on both read and write paths (defense-in-depth)
   * Prevents deletion if customer has sales
   */
  async delete(id: string, galleryId: string) {
    // SECURITY: findFirst with compound { id, galleryId } verifies ownership and loads relations
    // for the sales guard. deleteMany with the same compound where enforces tenant isolation on
    // the write path itself — defense-in-depth ensures galleryId is present in the actual DELETE
    // statement even if the preceding read is somehow bypassed.
    // TOCTOU protection: all three operations are wrapped in a single $transaction.
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.customer.findFirst({
        where: { id, galleryId },
        include: { sales: true },
      });

      if (!existing) {
        throw new NotFoundError(`Customer with ID ${id} not found`);
      }

      if (existing.sales.length > 0) {
        throw new BadRequestError(
          `Cannot delete customer: ${existing.sales.length} sale(s) reference this customer`
        );
      }

      const deleted = await tx.customer.deleteMany({ where: { id, galleryId } });

      if (deleted.count === 0) {
        throw new NotFoundError(`Customer with ID ${id} not found`);
      }

      return { id };
    });

    return result;
  }

  /**
   * Get customer statistics for a gallery
   * Multi-tenant: filtered by galleryId
   */
  async getStats(galleryId: string) {
    const [totalCustomers, activeCustomers] = await Promise.all([
      prisma.customer.count({ where: { galleryId } }),
      prisma.customer.count({
        where: {
          galleryId,
          sales: { some: {} },
        },
      }),
    ]);

    return {
      totalCustomers,
      activeCustomers,
    };
  }
}

export const customerService = new CustomerService();
