// OriginCountry CRUD service with audit logging
import prisma from '../lib/prisma';
import { auditService } from './audit.service';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';

interface GetAllParams {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
}

interface CreateCountryInput {
  code: string;
  name: string;
  flag?: string;
  customsDutyRate: number;
  isEU?: boolean;
  minShippingCost: number;
  maxShippingCost: number;
  avgShippingDays?: number;
  notes?: string;
}

interface UpdateCountryInput {
  code?: string;
  name?: string;
  flag?: string;
  customsDutyRate?: number;
  isEU?: boolean;
  minShippingCost?: number;
  maxShippingCost?: number;
  avgShippingDays?: number;
  notes?: string;
  isActive?: boolean;
}

export class CountryService {
  async getAll(params: GetAllParams) {
    const where: {
      isActive?: boolean;
      OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { code: { contains: string; mode: 'insensitive' } }>;
    } = {};

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.originCountry.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
      }),
      prisma.originCountry.count({ where }),
    ]);

    return { data, total };
  }

  async getById(id: string) {
    const country = await prisma.originCountry.findUnique({ where: { id } });
    if (!country) {
      throw new NotFoundError(`Country with ID ${id} not found`);
    }
    return country;
  }

  async create(input: CreateCountryInput, userId: string, ipAddress?: string) {
    // Check if code already exists
    const existing = await prisma.originCountry.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new BadRequestError(`Country with code ${input.code} already exists`);
    }

    const country = await prisma.originCountry.create({
      data: {
        code: input.code,
        name: input.name,
        flag: input.flag,
        customsDutyRate: input.customsDutyRate,
        isEU: input.isEU ?? false,
        minShippingCost: input.minShippingCost,
        maxShippingCost: input.maxShippingCost,
        avgShippingDays: input.avgShippingDays,
        notes: input.notes,
        isActive: true,
      },
    });

    // Log to audit
    await auditService.log({
      action: 'CREATE',
      entityType: 'OriginCountry',
      entityId: country.id,
      newValues: country,
      performedBy: userId,
      ipAddress,
    });

    return country;
  }

  async update(id: string, input: UpdateCountryInput, userId: string, ipAddress?: string) {
    const existing = await prisma.originCountry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Country with ID ${id} not found`);
    }

    // If code is being updated, check uniqueness
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.originCountry.findUnique({
        where: { code: input.code },
      });
      if (codeExists) {
        throw new BadRequestError(`Country with code ${input.code} already exists`);
      }
    }

    const updated = await prisma.originCountry.update({
      where: { id },
      data: {
        ...(input.code && { code: input.code }),
        ...(input.name && { name: input.name }),
        ...(input.flag !== undefined && { flag: input.flag }),
        ...(input.customsDutyRate !== undefined && { customsDutyRate: input.customsDutyRate }),
        ...(input.isEU !== undefined && { isEU: input.isEU }),
        ...(input.minShippingCost !== undefined && { minShippingCost: input.minShippingCost }),
        ...(input.maxShippingCost !== undefined && { maxShippingCost: input.maxShippingCost }),
        ...(input.avgShippingDays !== undefined && { avgShippingDays: input.avgShippingDays }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    // Log to audit
    await auditService.log({
      action: 'UPDATE',
      entityType: 'OriginCountry',
      entityId: id,
      oldValues: existing,
      newValues: updated,
      performedBy: userId,
      ipAddress,
    });

    return updated;
  }

  async delete(id: string, userId: string, ipAddress?: string) {
    const existing = await prisma.originCountry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Country with ID ${id} not found`);
    }

    // Check if country is in use by any vehicle
    const vehicleCount = await prisma.vehicle.count({
      where: { originCountryId: id },
    });

    if (vehicleCount > 0) {
      throw new BadRequestError(`Cannot delete country: ${vehicleCount} vehicle(s) reference this country`);
    }

    await prisma.originCountry.delete({ where: { id } });

    // Log to audit
    await auditService.log({
      action: 'DELETE',
      entityType: 'OriginCountry',
      entityId: id,
      oldValues: existing,
      performedBy: userId,
      ipAddress,
    });

    return { id };
  }

  async getActiveCountries() {
    return prisma.originCountry.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}

export const countryService = new CountryService();
