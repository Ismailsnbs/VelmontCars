import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';
import { sendSuccess, sendPaginated, parsePagination } from '../utils/helpers';

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export class AuditLogController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query);
      // AuditLog model uses performedAt, not createdAt
      if (!req.query.sortBy) {
        pagination.sortBy = 'performedAt';
      }

      const entityType = req.query.entityType
        ? getParam(req.query.entityType as string | string[])
        : undefined;

      const action = req.query.action
        ? getParam(req.query.action as string | string[])
        : undefined;

      const performedBy = req.query.performedBy
        ? getParam(req.query.performedBy as string | string[])
        : undefined;

      const { data, total } = await auditService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        skip: pagination.skip,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder as 'asc' | 'desc',
        entityType,
        action,
        performedBy,
      });

      sendPaginated(res, data, total, pagination.page, pagination.limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const auditLog = await auditService.getById(id);
      sendSuccess(res, auditLog);
    } catch (error) {
      next(error);
    }
  }
}

export const auditLogController = new AuditLogController();
