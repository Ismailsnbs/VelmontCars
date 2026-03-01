import { z } from 'zod';

export const createNotificationSchema = z.object({
  type: z.enum(['TAX_CHANGE', 'CURRENCY_ALERT', 'GENERAL_ANNOUNCEMENT', 'SYSTEM_MAINTENANCE']),
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
  targetType: z.enum(['ALL', 'GALLERY', 'SUBSCRIPTION']),
  targetIds: z.array(z.string()).optional().default([]),
}).superRefine((data, ctx) => {
  if (data.targetType !== 'ALL' && (!data.targetIds || data.targetIds.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['targetIds'],
      message: 'targetIds is required when targetType is not ALL',
    });
  }
});

export const notificationQuerySchema = z.object({
  type: z.enum(['TAX_CHANGE', 'CURRENCY_ALERT', 'GENERAL_ANNOUNCEMENT', 'SYSTEM_MAINTENANCE']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const galleryNotificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
export type GalleryNotificationQueryInput = z.infer<typeof galleryNotificationQuerySchema>;
