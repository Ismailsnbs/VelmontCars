import { z } from 'zod';

// GET /stock-alerts/low-stock — optional pagination query params
export const lowStockQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
});

// POST /stock-alerts/check — no body expected (galleryId comes from middleware)
export const checkAlertSchema = z.object({}).strict();

export type LowStockQuery = z.infer<typeof lowStockQuerySchema>;
export type CheckAlertBody = z.infer<typeof checkAlertSchema>;
