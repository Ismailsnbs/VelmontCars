// Report query validation schemas
import { z } from 'zod';

const VEHICLE_STATUSES = ['TRANSIT', 'IN_STOCK', 'RESERVED', 'SOLD'] as const;

// ISO date string validator (YYYY-MM-DD or full ISO-8601)
const isoDateString = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?$/,
    'Must be a valid ISO date string (e.g. 2024-01-01)',
  )
  .optional();

export const reportFilterSchema = z.object({
  startDate: isoDateString,
  endDate: isoDateString,
  status: z.enum(VEHICLE_STATUSES).optional(),
});

export const financialFilterSchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, 'Year must be a 4-digit number')
    .transform(Number)
    .refine((v) => v >= 2000 && v <= 2100, 'Year must be between 2000 and 2100')
    .optional(),
  month: z
    .string()
    .regex(/^\d{1,2}$/, 'Month must be a number')
    .transform(Number)
    .refine((v) => v >= 1 && v <= 12, 'Month must be between 1 and 12')
    .optional(),
});

export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
export type FinancialFilterInput = z.infer<typeof financialFilterSchema>;
