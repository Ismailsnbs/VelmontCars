// Gallery validation schemas
import { z } from 'zod';

export const createGallerySchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logo: z.string().optional(),
  subscription: z.enum(['BASIC', 'PROFESSIONAL', 'ENTERPRISE']).optional().default('BASIC'),
});

export const updateGallerySchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logo: z.string().optional(),
  subscription: z.enum(['BASIC', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  isActive: z.boolean().optional(),
  subscriptionEnds: z.string().datetime().optional(),
});

export type CreateGalleryInput = z.infer<typeof createGallerySchema>;
export type UpdateGalleryInput = z.infer<typeof updateGallerySchema>;
