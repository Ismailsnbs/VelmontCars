// OriginCountry validation schemas
import { z } from 'zod';

export const createCountrySchema = z.object({
  code: z.string().min(2).max(3),
  name: z.string().min(1),
  flag: z.string().optional(),
  customsDutyRate: z.number().min(0),
  isEU: z.boolean().optional(),
  minShippingCost: z.number().min(0),
  maxShippingCost: z.number().min(0),
  avgShippingDays: z.number().int().optional(),
  notes: z.string().optional(),
});

export const updateCountrySchema = z.object({
  code: z.string().min(2).max(3).optional(),
  name: z.string().min(1).optional(),
  flag: z.string().optional(),
  customsDutyRate: z.number().min(0).optional(),
  isEU: z.boolean().optional(),
  minShippingCost: z.number().min(0).optional(),
  maxShippingCost: z.number().min(0).optional(),
  avgShippingDays: z.number().int().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCountryInput = z.infer<typeof createCountrySchema>;
export type UpdateCountryInput = z.infer<typeof updateCountrySchema>;
