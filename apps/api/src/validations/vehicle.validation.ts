// Vehicle validation schemas
import { z } from 'zod';

const VEHICLE_STATUSES = ['TRANSIT', 'IN_STOCK', 'RESERVED', 'SOLD'] as const;
const FUEL_TYPES = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG'] as const;
const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC', 'SEMI_AUTO'] as const;
const SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'brand',
  'model',
  'year',
  'fobPrice',
  'totalCost',
  'engineCC',
  'status',
] as const;

export const createVehicleSchema = z.object({
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2),
  vin: z.string().min(1).max(20).optional(),
  color: z.string().min(1).max(50).optional(),
  mileage: z.number().int().min(0).optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
  transmission: z.enum(TRANSMISSIONS).optional(),
  engineCC: z.number().int().min(1),
  bodyType: z.string().min(1).max(50).optional(),

  originCountryId: z.string().cuid(),

  fobPrice: z.number().positive(),
  fobCurrency: z.string().length(3).default('USD'),
  shippingCost: z.number().min(0).optional(),
  insuranceCost: z.number().min(0).optional(),

  // Calculated/optional tax fields (can be set by import calculator)
  cifValue: z.number().min(0).optional(),
  customsDuty: z.number().min(0).optional(),
  kdv: z.number().min(0).optional(),
  fif: z.number().min(0).optional(),
  generalFif: z.number().min(0).optional(),
  gkk: z.number().min(0).optional(),
  wharfFee: z.number().min(0).optional(),
  bandrol: z.number().min(0).optional(),
  otherFees: z.number().min(0).optional(),
  totalImportCost: z.number().min(0).optional(),

  additionalExpenses: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),

  status: z.enum(VEHICLE_STATUSES).optional().default('TRANSIT'),
  estimatedArrival: z.string().datetime().optional(),
  arrivalDate: z.string().datetime().optional(),
  description: z.string().max(2000).optional(),

  taxSnapshotId: z.string().cuid().optional(),
});

export const updateVehicleSchema = z.object({
  brand: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2).optional(),
  vin: z.string().min(1).max(20).optional(),
  color: z.string().min(1).max(50).optional(),
  mileage: z.number().int().min(0).optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
  transmission: z.enum(TRANSMISSIONS).optional(),
  engineCC: z.number().int().min(1).optional(),
  bodyType: z.string().min(1).max(50).optional(),

  originCountryId: z.string().cuid().optional(),

  fobPrice: z.number().positive().optional(),
  fobCurrency: z.string().length(3).optional(),
  shippingCost: z.number().min(0).optional(),
  insuranceCost: z.number().min(0).optional(),

  cifValue: z.number().min(0).optional(),
  customsDuty: z.number().min(0).optional(),
  kdv: z.number().min(0).optional(),
  fif: z.number().min(0).optional(),
  generalFif: z.number().min(0).optional(),
  gkk: z.number().min(0).optional(),
  wharfFee: z.number().min(0).optional(),
  bandrol: z.number().min(0).optional(),
  otherFees: z.number().min(0).optional(),
  totalImportCost: z.number().min(0).optional(),

  additionalExpenses: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  profit: z.number().optional(),
  profitMargin: z.number().optional(),

  estimatedArrival: z.string().datetime().optional(),
  arrivalDate: z.string().datetime().optional(),
  soldDate: z.string().datetime().optional(),
  description: z.string().max(2000).optional(),

  taxSnapshotId: z.string().cuid().optional(),
});

export const vehicleQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20)),
  sortBy: z.enum(SORT_FIELDS).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

  // Filters
  status: z.enum(VEHICLE_STATUSES).optional(),
  brand: z.string().optional(),
  search: z.string().optional(),

  yearFrom: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  yearTo: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),

  fobPriceMin: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),
  fobPriceMax: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),

  engineCCMin: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  engineCCMax: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),

  // MASTER_ADMIN can filter by galleryId via query
  galleryId: z.string().cuid().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(VEHICLE_STATUSES),
  arrivalDate: z.string().datetime().optional(),
  soldDate: z.string().datetime().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleQuery = z.infer<typeof vehicleQuerySchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
