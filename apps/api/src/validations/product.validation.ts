// Product validation schemas
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.enum(['CLEANING', 'SPRAY', 'CLOTH', 'BRUSH', 'CHEMICAL', 'OTHER']),
  unit: z.string().min(1, 'Unit is required'),
  unitPrice: z.number().positive('Unit price must be positive'),
  minStockLevel: z.number().min(0, 'Min stock level must be >= 0').default(0),
  barcode: z.string().optional(),
  description: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.enum(['CLEANING', 'SPRAY', 'CLOTH', 'BRUSH', 'CHEMICAL', 'OTHER']).optional(),
  search: z.string().optional(),
  belowMinStock: z.enum(['true', 'false']).optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const productIdParamSchema = z.object({
  id: z.string().cuid('Invalid product ID'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;
