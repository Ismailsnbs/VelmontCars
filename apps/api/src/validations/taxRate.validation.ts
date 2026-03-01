import { z } from 'zod';

export const createTaxRateSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  nameEn: z.string().optional(),
  rate: z.number().min(0),
  rateType: z.enum(['PERCENTAGE', 'FIXED', 'PER_CC']),
  vehicleType: z.enum(['PASSENGER', 'COMMERCIAL', 'ALL']).optional(),
  minEngineCC: z.number().int().optional(),
  maxEngineCC: z.number().int().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional().nullable(),
});

export const updateTaxRateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nameEn: z.string().optional(),
  rate: z.number().min(0).optional(),
  rateType: z.enum(['PERCENTAGE', 'FIXED', 'PER_CC']).optional(),
  vehicleType: z.enum(['PASSENGER', 'COMMERCIAL', 'ALL']).optional().nullable(),
  minEngineCC: z.number().int().optional().nullable(),
  maxEngineCC: z.number().int().optional().nullable(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional().nullable(),
  reason: z.string().optional(),
});

export type CreateTaxRateInput = z.infer<typeof createTaxRateSchema>;
export type UpdateTaxRateInput = z.infer<typeof updateTaxRateSchema>;
