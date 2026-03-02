// Calculator validation schemas
import { z } from 'zod';

const VEHICLE_TYPES = ['PASSENGER', 'COMMERCIAL'] as const;
const CURRENT_YEAR = new Date().getFullYear();

export const calculateSchema = z.object({
  fobPrice: z.number().positive('FOB price must be positive'),
  fobCurrency: z.string().min(3).max(3).default('USD'),
  originCountryId: z.string().cuid('Invalid origin country ID'),
  engineCC: z.number().int().positive().max(20000),
  vehicleType: z.enum(VEHICLE_TYPES),
  modelYear: z.number().int().min(1900).max(CURRENT_YEAR + 1),
  shippingCost: z.number().min(0).default(0),
  insuranceCost: z.number().min(0).default(0),
  vehicleId: z.string().cuid().optional(),
  preview: z.boolean().optional().default(false),
});

export const saveToVehicleSchema = z.object({
  vehicleId: z.string().cuid('Invalid vehicle ID'),
});

export const calculationIdParamSchema = z.object({
  id: z.string().cuid('Invalid calculation ID'),
});

export const calculationHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CalculateInput = z.infer<typeof calculateSchema>;
export type SaveToVehicleInput = z.infer<typeof saveToVehicleSchema>;
