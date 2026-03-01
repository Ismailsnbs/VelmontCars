// Sale validation schemas
import { z } from 'zod';

// Ödeme yöntemi enum değerleri
// Schema'da paymentType String? olarak tanımlanmış; burada business-level enum uyguluyoruz
export const PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'INSTALLMENT',
  'OTHER',
] as const;

export const createSaleSchema = z.object({
  vehicleId: z.string().cuid('Invalid vehicle ID'),
  // Schema'da customerId required — müşteri zorunlu
  customerId: z.string().cuid('Invalid customer ID'),
  salePrice: z
    .number({ required_error: 'Sale price is required' })
    .positive('Sale price must be positive'),
  saleDate: z
    .string()
    .datetime({ message: 'Sale date must be a valid ISO 8601 datetime' })
    .optional(),
  paymentMethod: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}` }),
  }),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

export const updateSaleSchema = z.object({
  salePrice: z.number().positive('Sale price must be positive').optional(),
  paymentMethod: z
    .enum(PAYMENT_METHODS, {
      errorMap: () => ({ message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}` }),
    })
    .optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

export const saleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z
    .string()
    .datetime({ message: 'startDate must be a valid ISO 8601 datetime' })
    .optional(),
  endDate: z
    .string()
    .datetime({ message: 'endDate must be a valid ISO 8601 datetime' })
    .optional(),
});

export const saleIdParamSchema = z.object({
  id: z.string().cuid('Invalid sale ID'),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type SaleQueryParams = z.infer<typeof saleQuerySchema>;
