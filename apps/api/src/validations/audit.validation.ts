import { z } from 'zod';

export const auditQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  entityType: z.string().min(1).max(100).optional(),
  action: z.string().min(1).max(100).optional(),
  performedBy: z.string().min(1).max(255).optional(),
});

export type AuditQueryInput = z.infer<typeof auditQuerySchema>;
