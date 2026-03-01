import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { auditService } from './audit.service';
import { NotFoundError } from '../middleware/error.middleware';
import { emitToMaster } from '../socket';
import { SOCKET_EVENTS } from '../socket/events';

interface GetAllTaxRateParams {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
}

interface CreateTaxRateData {
  code: string;
  name: string;
  nameEn?: string;
  rate: number;
  rateType: 'PERCENTAGE' | 'FIXED' | 'PER_CC';
  vehicleType?: 'PASSENGER' | 'COMMERCIAL' | 'ALL';
  minEngineCC?: number;
  maxEngineCC?: number;
  description?: string;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string | null;
}

interface UpdateTaxRateData {
  name?: string;
  nameEn?: string;
  rate?: number;
  rateType?: 'PERCENTAGE' | 'FIXED' | 'PER_CC';
  vehicleType?: 'PASSENGER' | 'COMMERCIAL' | 'ALL' | null;
  minEngineCC?: number | null;
  maxEngineCC?: number | null;
  description?: string;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string | null;
}

export class TaxRateService {
  async getAll(params: GetAllTaxRateParams) {
    const where: Prisma.TaxRateWhereInput = {};

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
      prisma.taxRate.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
        include: {
          history: { orderBy: { changedAt: 'desc' }, take: 5 },
        },
      }),
      prisma.taxRate.count({ where }),
    ]);

    return { data, total };
  }

  async getById(id: string) {
    const taxRate = await prisma.taxRate.findUnique({
      where: { id },
      include: {
        history: { orderBy: { changedAt: 'desc' } },
      },
    });

    if (!taxRate) throw new NotFoundError('Tax rate not found');

    return taxRate;
  }

  async create(data: CreateTaxRateData, userId: string, ip?: string) {
    const taxRate = await prisma.taxRate.create({
      data: {
        code: data.code,
        name: data.name,
        nameEn: data.nameEn,
        rate: data.rate,
        rateType: data.rateType,
        vehicleType: data.vehicleType,
        minEngineCC: data.minEngineCC,
        maxEngineCC: data.maxEngineCC,
        description: data.description,
        isActive: data.isActive ?? true,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        createdBy: userId,
      },
    });

    await auditService.log({
      action: 'CREATE',
      entityType: 'TaxRate',
      entityId: taxRate.id,
      newValues: data,
      performedBy: userId,
      ipAddress: ip,
    });

    try {
      emitToMaster(SOCKET_EVENTS.TAX_RATE_CHANGED, {
        taxId: taxRate.id,
        taxName: taxRate.name,
        taxCode: taxRate.code,
        newRate: Number(taxRate.rate),
        action: 'created',
      });
    } catch (emitError) {
      console.error('[TaxRateService] Socket emit error (create):', emitError);
    }

    return taxRate;
  }

  async update(
    id: string,
    data: UpdateTaxRateData,
    userId: string,
    reason?: string,
    ip?: string,
  ) {
    const existing = await prisma.taxRate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Tax rate not found');

    // TaxRateHistory sadece rate degistiginde olusturulur
    if (data.rate !== undefined && data.rate !== Number(existing.rate)) {
      await prisma.taxRateHistory.create({
        data: {
          taxRateId: id,
          oldValue: existing.rate,
          newValue: data.rate,
          changedBy: userId,
          reason: reason ?? null,
        },
      });
    }

    const updated = await prisma.taxRate.update({
      where: { id },
      data: {
        ...data,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
        effectiveTo: data.effectiveTo !== undefined
          ? (data.effectiveTo ? new Date(data.effectiveTo) : null)
          : undefined,
      },
      include: {
        history: { orderBy: { changedAt: 'desc' }, take: 5 },
      },
    });

    await auditService.log({
      action: 'UPDATE',
      entityType: 'TaxRate',
      entityId: id,
      oldValues: existing,
      newValues: data,
      performedBy: userId,
      ipAddress: ip,
    });

    try {
      emitToMaster(SOCKET_EVENTS.TAX_RATE_CHANGED, {
        taxId: updated.id,
        taxName: updated.name,
        taxCode: updated.code,
        newRate: Number(updated.rate),
        action: 'updated',
      });
    } catch (emitError) {
      console.error('[TaxRateService] Socket emit error (update):', emitError);
    }

    return updated;
  }

  async delete(id: string, userId: string, ip?: string) {
    const existing = await prisma.taxRate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Tax rate not found');

    await prisma.taxRate.delete({ where: { id } });

    await auditService.log({
      action: 'DELETE',
      entityType: 'TaxRate',
      entityId: id,
      oldValues: existing,
      performedBy: userId,
      ipAddress: ip,
    });

    try {
      emitToMaster(SOCKET_EVENTS.TAX_RATE_CHANGED, {
        taxId: existing.id,
        taxName: existing.name,
        taxCode: existing.code,
        newRate: Number(existing.rate),
        action: 'deleted',
      });
    } catch (emitError) {
      console.error('[TaxRateService] Socket emit error (delete):', emitError);
    }
  }

  async getHistory(taxRateId: string) {
    // Once TaxRate varligini dogrula
    const exists = await prisma.taxRate.findUnique({ where: { id: taxRateId } });
    if (!exists) throw new NotFoundError('Tax rate not found');

    return prisma.taxRateHistory.findMany({
      where: { taxRateId },
      orderBy: { changedAt: 'desc' },
    });
  }

  async getActiveTaxRates() {
    return prisma.taxRate.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }
}

export const taxRateService = new TaxRateService();
