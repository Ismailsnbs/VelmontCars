import { z } from 'zod';

export const updateRateSchema = z.object({
  currencyCode: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters')
    .toUpperCase(),
  buyRate: z.number().positive('Buy rate must be positive'),
  sellRate: z.number().positive('Sell rate must be positive'),
});

export const bulkUpdateSchema = z.object({
  rates: z
    .array(
      z.object({
        currencyCode: z
          .string()
          .length(3, 'Currency code must be exactly 3 characters')
          .toUpperCase(),
        buyRate: z.number().positive('Buy rate must be positive'),
        sellRate: z.number().positive('Sell rate must be positive'),
      }),
    )
    .min(1, 'At least one rate must be provided'),
});

export const updateSettingsSchema = z.object({
  updateMode: z.enum(['manual', 'auto']).optional(),
  apiProvider: z.string().min(1).optional(),
  apiKey: z.string().min(1).optional(),
  updateInterval: z
    .number()
    .int()
    .min(1, 'Interval must be at least 1 minute')
    .max(1440, 'Interval must be at most 1440 minutes (24 hours)')
    .optional(),
});

export type UpdateRateInput = z.infer<typeof updateRateSchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
