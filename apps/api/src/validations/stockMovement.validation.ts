// Stock movement validation schemas
import { z } from 'zod';

export const createStockMovementSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().positive('Quantity must be positive'),
  note: z.string().optional(),
});

export const stockMovementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const productIdParamSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
});

export const stockMovementIdParamSchema = z.object({
  id: z.string().cuid('Invalid stock movement ID'),
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type StockMovementQueryParams = z.infer<typeof stockMovementQuerySchema>;
