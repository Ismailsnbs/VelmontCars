import prisma from '../lib/prisma';

interface AuditLogInput {
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: unknown;
  newValues?: unknown;
  performedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

interface GetAllAuditParams {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  entityType?: string;
  action?: string;
  performedBy?: string;
}

export class AuditService {
  async log(input: AuditLogInput) {
    return prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValues: input.oldValues ?? undefined,
        newValues: input.newValues ?? undefined,
        performedBy: input.performedBy,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  async getAll(params: GetAllAuditParams) {
    const where: {
      entityType?: string;
      action?: string;
      performedBy?: string;
    } = {};

    if (params.entityType) where.entityType = params.entityType;
    if (params.action) where.action = params.action;
    if (params.performedBy) where.performedBy = params.performedBy;

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }

  async getById(id: string) {
    return prisma.auditLog.findUnique({ where: { id } });
  }
}

export const auditService = new AuditService();
