// Vehicle CRUD service — gallery-scoped (multi-tenant)
import { Prisma, VehicleStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';
import { auditService } from './audit.service';
import {
  CreateVehicleInput,
  UpdateVehicleInput,
  UpdateStatusInput,
} from '../validations/vehicle.validation';
import { emitToGallery } from '../socket';
import { SOCKET_EVENTS } from '../socket/events';

interface GetAllParams {
  galleryId: string;
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  status?: 'TRANSIT' | 'IN_STOCK' | 'RESERVED' | 'SOLD';
  brand?: string;
  search?: string;
  yearFrom?: number;
  yearTo?: number;
  fobPriceMin?: number;
  fobPriceMax?: number;
  engineCCMin?: number;
  engineCCMax?: number;
}

export class VehicleService {
  // ─── List ────────────────────────────────────────────────────────────────

  async getAll(params: GetAllParams) {
    const where: Prisma.VehicleWhereInput = {
      // CRITICAL: Always scope to the tenant's gallery
      galleryId: params.galleryId,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.brand) {
      where.brand = { contains: params.brand, mode: 'insensitive' };
    }

    if (params.search) {
      where.OR = [
        { brand: { contains: params.search, mode: 'insensitive' } },
        { model: { contains: params.search, mode: 'insensitive' } },
        { vin: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.yearFrom !== undefined || params.yearTo !== undefined) {
      where.year = {};
      if (params.yearFrom !== undefined) {
        (where.year as Prisma.IntFilter).gte = params.yearFrom;
      }
      if (params.yearTo !== undefined) {
        (where.year as Prisma.IntFilter).lte = params.yearTo;
      }
    }

    if (params.fobPriceMin !== undefined || params.fobPriceMax !== undefined) {
      where.fobPrice = {};
      if (params.fobPriceMin !== undefined) {
        (where.fobPrice as Prisma.DecimalFilter).gte = new Prisma.Decimal(
          params.fobPriceMin
        );
      }
      if (params.fobPriceMax !== undefined) {
        (where.fobPrice as Prisma.DecimalFilter).lte = new Prisma.Decimal(
          params.fobPriceMax
        );
      }
    }

    if (params.engineCCMin !== undefined || params.engineCCMax !== undefined) {
      where.engineCC = {};
      if (params.engineCCMin !== undefined) {
        (where.engineCC as Prisma.IntFilter).gte = params.engineCCMin;
      }
      if (params.engineCCMax !== undefined) {
        (where.engineCC as Prisma.IntFilter).lte = params.engineCCMax;
      }
    }

    const [data, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc' },
        include: {
          // Only the main image to keep the list lightweight
          images: {
            where: { isMain: true },
            take: 1,
          },
          originCountry: {
            select: {
              id: true,
              code: true,
              name: true,
              flag: true,
            },
          },
          _count: {
            select: {
              expenses: true,
              documents: true,
            },
          },
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { data, total };
  }

  // ─── Single vehicle ───────────────────────────────────────────────────────

  async getById(id: string, galleryId: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        galleryId, // Tenant isolation
      },
      include: {
        images: {
          orderBy: [{ isMain: 'desc' }, { order: 'asc' }],
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        expenses: {
          orderBy: { date: 'desc' },
        },
        calculations: {
          orderBy: { calculatedAt: 'desc' },
          include: {
            taxSnapshot: true,
          },
        },
        sale: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        originCountry: true,
        taxSnapshot: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  // ─── Create ──────────────────────────────────────────────────────────────

  async create(input: CreateVehicleInput, galleryId: string, performedBy?: string, ipAddress?: string) {
    // Validate that the originCountry exists and is active
    const country = await prisma.originCountry.findFirst({
      where: { id: input.originCountryId, isActive: true },
    });

    if (!country) {
      throw new BadRequestError(
        `Origin country with ID ${input.originCountryId} not found or inactive`
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        brand: input.brand,
        model: input.model,
        year: input.year,
        vin: input.vin,
        color: input.color,
        mileage: input.mileage,
        fuelType: input.fuelType,
        transmission: input.transmission,
        engineCC: input.engineCC,
        bodyType: input.bodyType,

        originCountryId: input.originCountryId,

        fobPrice: new Prisma.Decimal(input.fobPrice),
        fobCurrency: input.fobCurrency ?? 'USD',
        shippingCost: input.shippingCost !== undefined
          ? new Prisma.Decimal(input.shippingCost)
          : undefined,
        insuranceCost: input.insuranceCost !== undefined
          ? new Prisma.Decimal(input.insuranceCost)
          : undefined,
        cifValue: input.cifValue !== undefined
          ? new Prisma.Decimal(input.cifValue)
          : undefined,
        customsDuty: input.customsDuty !== undefined
          ? new Prisma.Decimal(input.customsDuty)
          : undefined,
        kdv: input.kdv !== undefined
          ? new Prisma.Decimal(input.kdv)
          : undefined,
        fif: input.fif !== undefined
          ? new Prisma.Decimal(input.fif)
          : undefined,
        generalFif: input.generalFif !== undefined
          ? new Prisma.Decimal(input.generalFif)
          : undefined,
        gkk: input.gkk !== undefined
          ? new Prisma.Decimal(input.gkk)
          : undefined,
        wharfFee: input.wharfFee !== undefined
          ? new Prisma.Decimal(input.wharfFee)
          : undefined,
        bandrol: input.bandrol !== undefined
          ? new Prisma.Decimal(input.bandrol)
          : undefined,
        otherFees: input.otherFees !== undefined
          ? new Prisma.Decimal(input.otherFees)
          : undefined,
        totalImportCost: input.totalImportCost !== undefined
          ? new Prisma.Decimal(input.totalImportCost)
          : undefined,

        additionalExpenses: input.additionalExpenses !== undefined
          ? new Prisma.Decimal(input.additionalExpenses)
          : new Prisma.Decimal(0),
        totalCost: input.totalCost !== undefined
          ? new Prisma.Decimal(input.totalCost)
          : undefined,
        salePrice: input.salePrice !== undefined
          ? new Prisma.Decimal(input.salePrice)
          : undefined,

        status: (input.status ?? 'TRANSIT') as VehicleStatus,
        estimatedArrival: input.estimatedArrival
          ? new Date(input.estimatedArrival)
          : undefined,
        arrivalDate: input.arrivalDate
          ? new Date(input.arrivalDate)
          : undefined,
        description: input.description,

        galleryId,
        taxSnapshotId: input.taxSnapshotId,
      },
      include: {
        originCountry: {
          select: {
            id: true,
            code: true,
            name: true,
            flag: true,
          },
        },
        images: true,
      },
    });

    if (performedBy) {
      await auditService.log({
        action: 'CREATE',
        entityType: 'Vehicle',
        entityId: vehicle.id,
        newValues: { brand: vehicle.brand, model: vehicle.model, year: vehicle.year },
        performedBy,
        ipAddress,
      });
    }

    try {
      emitToGallery(galleryId, SOCKET_EVENTS.VEHICLE_CREATED, {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
      });
    } catch (emitError) {
      console.error('[VehicleService] Socket emit error (create):', emitError);
    }

    return vehicle;
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  async update(id: string, input: UpdateVehicleInput, galleryId: string, performedBy?: string, ipAddress?: string) {
    const toDecimal = (v: number | undefined) =>
      v !== undefined ? new Prisma.Decimal(v) : undefined;

    // U-MT1: findFirst (ownership guard) ve actual write aynı $transaction içinde.
    // Race condition olmaksızın atomik sahiplik doğrulaması + güncelleme sağlanır.
    const { existing, updated } = await prisma.$transaction(async (tx) => {
      // Verify ownership inside transaction
      const foundExisting = await tx.vehicle.findFirst({
        where: { id, galleryId },
      });

      if (!foundExisting) {
        throw new NotFoundError(`Vehicle with ID ${id} not found`);
      }

      // Validate new originCountry if provided
      if (input.originCountryId && input.originCountryId !== foundExisting.originCountryId) {
        const country = await tx.originCountry.findFirst({
          where: { id: input.originCountryId, isActive: true },
        });

        if (!country) {
          throw new BadRequestError(
            `Origin country with ID ${input.originCountryId} not found or inactive`
          );
        }
      }

      const updatedVehicle = await tx.vehicle.update({
        where: { id, galleryId },
        data: {
          ...(input.brand !== undefined && { brand: input.brand }),
          ...(input.model !== undefined && { model: input.model }),
          ...(input.year !== undefined && { year: input.year }),
          ...(input.vin !== undefined && { vin: input.vin }),
          ...(input.color !== undefined && { color: input.color }),
          ...(input.mileage !== undefined && { mileage: input.mileage }),
          ...(input.fuelType !== undefined && { fuelType: input.fuelType }),
          ...(input.transmission !== undefined && { transmission: input.transmission }),
          ...(input.engineCC !== undefined && { engineCC: input.engineCC }),
          ...(input.bodyType !== undefined && { bodyType: input.bodyType }),
          ...(input.originCountryId !== undefined && { originCountryId: input.originCountryId }),

          ...(input.fobPrice !== undefined && { fobPrice: toDecimal(input.fobPrice) }),
          ...(input.fobCurrency !== undefined && { fobCurrency: input.fobCurrency }),
          ...(input.shippingCost !== undefined && { shippingCost: toDecimal(input.shippingCost) }),
          ...(input.insuranceCost !== undefined && { insuranceCost: toDecimal(input.insuranceCost) }),
          ...(input.cifValue !== undefined && { cifValue: toDecimal(input.cifValue) }),
          ...(input.customsDuty !== undefined && { customsDuty: toDecimal(input.customsDuty) }),
          ...(input.kdv !== undefined && { kdv: toDecimal(input.kdv) }),
          ...(input.fif !== undefined && { fif: toDecimal(input.fif) }),
          ...(input.generalFif !== undefined && { generalFif: toDecimal(input.generalFif) }),
          ...(input.gkk !== undefined && { gkk: toDecimal(input.gkk) }),
          ...(input.wharfFee !== undefined && { wharfFee: toDecimal(input.wharfFee) }),
          ...(input.bandrol !== undefined && { bandrol: toDecimal(input.bandrol) }),
          ...(input.otherFees !== undefined && { otherFees: toDecimal(input.otherFees) }),
          ...(input.totalImportCost !== undefined && { totalImportCost: toDecimal(input.totalImportCost) }),
          ...(input.additionalExpenses !== undefined && { additionalExpenses: toDecimal(input.additionalExpenses) }),
          ...(input.totalCost !== undefined && { totalCost: toDecimal(input.totalCost) }),
          ...(input.salePrice !== undefined && { salePrice: toDecimal(input.salePrice) }),
          ...(input.profit !== undefined && { profit: toDecimal(input.profit) }),
          ...(input.profitMargin !== undefined && { profitMargin: toDecimal(input.profitMargin) }),

          ...(input.estimatedArrival !== undefined && {
            estimatedArrival: new Date(input.estimatedArrival),
          }),
          ...(input.arrivalDate !== undefined && {
            arrivalDate: new Date(input.arrivalDate),
          }),
          ...(input.soldDate !== undefined && {
            soldDate: new Date(input.soldDate),
          }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.taxSnapshotId !== undefined && { taxSnapshotId: input.taxSnapshotId }),
        },
        include: {
          originCountry: {
            select: {
              id: true,
              code: true,
              name: true,
              flag: true,
            },
          },
          images: {
            where: { isMain: true },
            take: 1,
          },
        },
      });

      return { existing: foundExisting, updated: updatedVehicle };
    });

    if (performedBy) {
      await auditService.log({
        action: 'UPDATE',
        entityType: 'Vehicle',
        entityId: id,
        oldValues: { brand: existing.brand, model: existing.model },
        newValues: input,
        performedBy,
        ipAddress,
      });
    }

    return updated;
  }

  // ─── Delete ──────────────────────────────────────────────────────────────

  async delete(id: string, galleryId: string, performedBy?: string, ipAddress?: string) {
    // U-MT1: findFirst (ownership guard) + sale check + delete aynı $transaction içinde.
    // Guard ile delete arasında başka bir istek aracı değiştiremez.
    const existing = await prisma.$transaction(async (tx) => {
      const foundExisting = await tx.vehicle.findFirst({
        where: { id, galleryId },
        include: {
          sale: { select: { id: true } },
        },
      });

      if (!foundExisting) {
        throw new NotFoundError(`Vehicle with ID ${id} not found`);
      }

      // Prevent deletion if there is an active (completed) sale linked
      if (foundExisting.sale) {
        throw new BadRequestError(
          'Cannot delete a vehicle that has an associated sale record'
        );
      }

      // Hard delete — cascades to images, documents, expenses, calculations
      await tx.vehicle.delete({ where: { id, galleryId } });

      return foundExisting;
    });

    if (performedBy) {
      await auditService.log({
        action: 'DELETE',
        entityType: 'Vehicle',
        entityId: id,
        oldValues: { brand: existing.brand, model: existing.model, year: existing.year },
        performedBy,
        ipAddress,
      });
    }

    return { id };
  }

  // ─── Update status ────────────────────────────────────────────────────────

  async updateStatus(id: string, input: UpdateStatusInput, galleryId: string) {
    // Verify ownership
    const existing = await prisma.vehicle.findFirst({
      where: { id, galleryId },
    });

    if (!existing) {
      throw new NotFoundError(`Vehicle with ID ${id} not found`);
    }

    const updateData: Prisma.VehicleUpdateInput = {
      status: input.status as VehicleStatus,
    };

    // Auto-set timestamps on status transitions
    if (input.status === 'IN_STOCK') {
      updateData.arrivalDate = input.arrivalDate
        ? new Date(input.arrivalDate)
        : new Date();
    }

    if (input.status === 'SOLD') {
      updateData.soldDate = input.soldDate
        ? new Date(input.soldDate)
        : new Date();
    }

    // Explicit overrides take precedence
    if (input.arrivalDate) {
      updateData.arrivalDate = new Date(input.arrivalDate);
    }

    if (input.soldDate) {
      updateData.soldDate = new Date(input.soldDate);
    }

    const updated = await prisma.vehicle.update({
      where: { id, galleryId },
      data: updateData,
      select: {
        id: true,
        status: true,
        arrivalDate: true,
        soldDate: true,
        updatedAt: true,
      },
    });

    try {
      emitToGallery(galleryId, SOCKET_EVENTS.VEHICLE_STATUS_CHANGED, {
        id: updated.id,
        brand: existing.brand,
        model: existing.model,
        newStatus: updated.status,
      });
    } catch (emitError) {
      console.error('[VehicleService] Socket emit error (updateStatus):', emitError);
    }

    return updated;
  }

  // ─── Move vehicle to stock ────────────────────────────────────────────

  async moveToStock(id: string, galleryId: string, arrivalDate?: string) {
    // Verify ownership
    const existing = await prisma.vehicle.findFirst({
      where: { id, galleryId },
    });

    if (!existing) {
      throw new NotFoundError(`Vehicle with ID ${id} not found`);
    }

    // Verify current status is TRANSIT
    if (existing.status !== 'TRANSIT') {
      throw new BadRequestError(
        `Vehicle status must be TRANSIT to move to stock. Current status: ${existing.status}`
      );
    }

    const updated = await prisma.vehicle.update({
      where: { id, galleryId },
      data: {
        status: 'IN_STOCK',
        arrivalDate: arrivalDate ? new Date(arrivalDate) : new Date(),
      },
      select: {
        id: true,
        status: true,
        arrivalDate: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getStats(galleryId: string) {
    const [statusCounts, totalValueResult] = await Promise.all([
      // Count vehicles grouped by status for this gallery
      prisma.vehicle.groupBy({
        by: ['status'],
        where: { galleryId },
        _count: { _all: true },
      }),
      // Sum of totalCost for all non-cancelled vehicles in this gallery
      prisma.vehicle.aggregate({
        where: {
          galleryId,
          status: { notIn: ['SOLD'] },
          totalCost: { not: null },
        },
        _sum: { totalCost: true },
        _count: { _all: true },
      }),
    ]);

    // Map grouped counts to a flat object
    const counts: Record<string, number> = {
      TRANSIT: 0,
      IN_STOCK: 0,
      RESERVED: 0,
      SOLD: 0,
    };

    for (const row of statusCounts) {
      counts[row.status] = row._count._all;
    }

    const total = Object.values(counts).reduce((acc, v) => acc + v, 0);

    return {
      total,
      transit: counts['TRANSIT'],
      inStock: counts['IN_STOCK'],
      reserved: counts['RESERVED'],
      sold: counts['SOLD'],
      activeInventoryCount: totalValueResult._count._all,
      activeInventoryValue: totalValueResult._sum.totalCost,
    };
  }
}

export const vehicleService = new VehicleService();
